import Attendance from "../models/attendance.model.js";
import Student from "../models/student.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const markAttendance = asyncHandler(async (req, res) => {
    const { studentId, date, status, remark } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
        res.status(404);
        throw new Error("Student not found");
    }

    try {
        const attendance = await Attendance.create({
            studentId,
            date,
            status,
            remark
        });

        res.status(201).json({
            message: "Attendance recorded",
            attendance
        });
    } catch (err) {
        if (err.code === 11000) {
            res.status(400);
            throw new Error("Attendance already exists for this date");
        }
        throw err;
    }
});

export const updateAttendance = asyncHandler(async (req, res) => {
    const updateData = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
    );

    res.json({ message: "Attendance updated", attendance });
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
    const { date, standard } = req.query;

    if (!date || !standard) {
        res.status(400);
        throw new Error("date and standard are required");
    }

    // Get all students of that standard
    const students = await Student.find({ standard });

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

    const students = await Student.find({ standard });

    const studentIds = students.map(s => s._id);

    const attendance = await Attendance.find({
        studentId: { $in: studentIds }
    }).populate("studentId");

    res.json(attendance);
});

export const getAttendanceByRange = asyncHandler(async (req, res) => {
    const { standard, startDate, endDate } = req.query;

    if (!standard || !startDate || !endDate) {
        res.status(400);
        throw new Error("standard, startDate, and endDate are required");
    }

    const students = await Student.find({ standard });
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
