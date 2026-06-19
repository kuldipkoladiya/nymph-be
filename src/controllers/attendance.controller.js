import Attendance from "../models/attendance.model.js";
import Student from "../models/student.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendTextWhatsApp, getWhatsAppStatus } from "../utils/whatsappSender.js";

export const markAttendance = asyncHandler(async (req, res) => {
    const { studentId, date, status, remark } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
        res.status(404);
        throw new Error("Student not found");
    }

    try {
        const attendance = await Attendance.findOneAndUpdate(
            { studentId, date: new Date(date) },
            { status, remark },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(201).json({
            message: "Attendance recorded",
            attendance
        });

        // Trigger WhatsApp in background if student is absent
        if (status === "Absent" && req.body.sendWhatsApp) {
            (async () => {
                try {
                    if (!getWhatsAppStatus()) {
                        console.warn(`⚠️ [WhatsApp] Cannot send absentee notification for ${student.name}. WhatsApp client is not ready.`);
                        return;
                    }
                    if (!student.phone) {
                        console.warn(`⚠️ [WhatsApp] Student ${student.name} has no phone number configured.`);
                        return;
                    }

                    const dateString = new Date(date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                    });

                    const messageBody = `આદરણીય વાલીશ્રી,\nઆપને જણાવવાનું કે આપનું બાળક, *${student.name}* (રોલ નંબર: *${student.rollNumber}*), આજે (${dateString}) Nymph Classes માં *ગેરહાજર*  છે.\n\nકૃપા કરીને ગેરહાજરી અંગેની માહિતી સંસ્થાને આપશો.\n📞 વધુ માહિતી માટે સંસ્થાનો સંપર્ક કરો.\n\nઆભાર.\nNymph Classes`;

                    await sendTextWhatsApp(student.phone, messageBody);
                } catch (err) {
                    console.error("❌ [WhatsApp] Background absentee send error:", err);
                }
            })();
        }
    } catch (err) {
        if (err.code === 11000) {
            res.status(400);
            throw new Error("Attendance already exists for this date");
        }
        throw err;
    }
});

export const updateAttendance = asyncHandler(async (req, res) => {
    const { status, sendWhatsApp } = req.body;
    const updateData = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
    );

    res.json({ message: "Attendance updated", attendance });

    // Send WhatsApp if status is Absent and sendWhatsApp is true
    if (status === "Absent" && sendWhatsApp) {
        (async () => {
            try {
                const student = await Student.findById(attendance.studentId);
                if (!student || !student.phone) return;

                if (!getWhatsAppStatus()) {
                    console.warn(`⚠️ [WhatsApp] Cannot send absentee update notification for ${student.name}. Client is not ready.`);
                    return;
                }

                const dateString = new Date(attendance.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                });

                const messageBody = `વાલીશ્રી,\n\nઆપને જણાવવાનું કે આપનો બાળક, *${student.name}* (રોલ નંબર: *${student.rollNumber}*), આજે (${dateString}) Nymph Classes માં *ગેરહાજર* રહેલ છે.\n\nજો આપને કોઈ પ્રશ્ન હોય તો મહેરબાની કરીને ક્લાસના વહીવટી વિભાગનો સંપર્ક કરો.\n\nશુભેચ્છા સહ,\nNymph Classes`;

                await sendTextWhatsApp(student.phone, messageBody);
            } catch (err) {
                console.error("❌ [WhatsApp] Background absentee update error:", err);
            }
        })();
    }
});

export const getAttendanceByDate = asyncHandler(async (req, res) => {
    const { date } = req.params;

    const attendance = await Attendance.find({
        date: new Date(date)
    }).populate("studentId");

    res.json(attendance);
});

export const getStudentAttendance = asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    const attendance = await Attendance.find({ studentId });

    res.json(attendance);
});

export const getMonthlySummary = asyncHandler(async (req, res) => {
    const { studentId, month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await Attendance.find({
        studentId,
        date: { $gte: startDate, $lte: endDate }
    });

    const present = records.filter(r => r.status === "Present").length;
    const absent = records.filter(r => r.status === "Absent").length;
    const leave = records.filter(r => r.status === "Leave").length;

    res.json({
        month,
        year,
        present,
        absent,
        leave,
        totalDays: records.length
    });
});

export const getAttendanceByDateAndStandard = asyncHandler(async (req, res) => {
    const { date, standard, section } = req.query;

    if (!date || !standard) {
        res.status(400);
        throw new Error("date and standard are required");
    }

    // Get all students of that standard (and section, if provided)
    const studentFilter = { standard };
    if (section) {
        studentFilter.section = section;
    }
    const students = await Student.find(studentFilter);

    const studentIds = students.map(s => s._id);

    // Get attendance records for those students
    const attendance = await Attendance.find({
        studentId: { $in: studentIds },
        date: new Date(date)
    }).populate("studentId");

    res.json(attendance);
});

export const getAttendanceByStandard = asyncHandler(async (req, res) => {
    const { standard } = req.params;
    const { section } = req.query;

    const studentFilter = { standard };
    if (section) {
        studentFilter.section = section;
    }
    const students = await Student.find(studentFilter);

    const studentIds = students.map(s => s._id);

    const attendance = await Attendance.find({
        studentId: { $in: studentIds }
    }).populate("studentId");

    res.json(attendance);
});

export const getAttendanceByRange = asyncHandler(async (req, res) => {
    const { standard, startDate, endDate, section } = req.query;

    if (!standard || !startDate || !endDate) {
        res.status(400);
        throw new Error("standard, startDate, and endDate are required");
    }

    const studentFilter = { standard };
    if (section) {
        studentFilter.section = section;
    }
    const students = await Student.find(studentFilter);
    const studentIds = students.map(s => s._id);

    const attendance = await Attendance.find({
        studentId: { $in: studentIds },
        date: { 
            $gte: new Date(startDate), 
            $lte: new Date(endDate) 
        }
    }).populate("studentId").sort({ date: 1 });

    res.json(attendance);
});

export const deleteAttendance = asyncHandler(async (req, res) => {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) {
        res.status(404);
        throw new Error("Attendance record not found");
    }
    res.json({ message: "Attendance record deleted" });
});
