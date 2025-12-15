import Attendance from "../models/attendance.model.js";
import Student from "../models/student.model.js";

export const markAttendance = async (req, res) => {
    try {
        const { studentId, date, status, remark } = req.body;

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: "Student not found" });

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
            return res.status(400).json({ message: "Attendance already exists for this date" });
        }
        res.status(500).json({ error: err.message });
    }
};

export const updateAttendance = async (req, res) => {
    try {
        const updateData = req.body;

        const attendance = await Attendance.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json({ message: "Attendance updated", attendance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAttendanceByDate = async (req, res) => {
    try {
        const { date } = req.params;

        const attendance = await Attendance.find({
            date: new Date(date)
        }).populate("studentId");

        res.json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;

        const attendance = await Attendance.find({ studentId });

        res.json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getMonthlySummary = async (req, res) => {
    try {
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

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAttendanceByDateAndStandard = async (req, res) => {
    try {
        const { date, standard } = req.query;

        if (!date || !standard) {
            return res.status(400).json({ message: "date and standard are required" });
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

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAttendanceByStandard = async (req, res) => {
    try {
        const { standard } = req.params;

        const students = await Student.find({ standard });

        const studentIds = students.map(s => s._id);

        const attendance = await Attendance.find({
            studentId: { $in: studentIds }
        }).populate("studentId");

        res.json(attendance);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
