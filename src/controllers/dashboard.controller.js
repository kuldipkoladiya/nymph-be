import Student from "../models/student.model.js";
import Attendance from "../models/attendance.model.js";
import Result from "../models/result.model.js";
import FeeStructure from "../models/fees.model.js";
import Payment from "../models/payment.model.js";

export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1️⃣ TOTAL STUDENTS
        const totalStudents = await Student.countDocuments();

        // 2️⃣ TODAY'S ATTENDANCE
        const presentToday = await Attendance.countDocuments({
            date: today,
            status: "Present"
        });

        const absentToday = await Attendance.countDocuments({
            date: today,
            status: "Absent"
        });

        const totalMarkedToday = presentToday + absentToday;
        const attendancePercent = totalMarkedToday
            ? ((presentToday / totalMarkedToday) * 100).toFixed(2)
            : 0;

        // 3️⃣ STUDENTS PER STANDARD
        const classWise = await Student.aggregate([
            { $group: { _id: "$standard", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // 4️⃣ AVERAGE MARKS
        const avgMarksData = await Result.aggregate([
            {
                $group: {
                    _id: null,
                    avgPercentage: { $avg: "$percentage" }
                }
            }
        ]);
        const averagePercentage = avgMarksData[0]?.avgPercentage || 0;

        // 5️⃣ TOP 5 PERFORMERS
        const topStudents = await Result.find({})
            .sort({ percentage: -1 })
            .limit(5)
            .populate("studentId", "name rollNumber standard");

        // 6️⃣ FAIL COUNT
        const failCount = await Result.countDocuments({ grade: "Fail" });

        res.json({
            totalStudents,
            presentToday,
            absentToday,
            attendancePercent,
            classWise,
            averagePercentage,
            topStudents,
            failCount
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getStandardWiseFeeStats = async (req, res) => {
    try {
        const standards = await FeeStructure.find();

        const results = [];

        for (let std of standards) {
            const { standard, yearlyFee, otherFees } = std;

            const students = await Student.countDocuments({ standard });

            const otherFeeTotal = otherFees.reduce(
                (sum, f) => sum + f.amount,
                0
            );

            const totalFeePerStudent = yearlyFee + otherFeeTotal;

            const totalFee = totalFeePerStudent * students;

            // Payments received for this standard
            const payments = await Payment.aggregate([
                {
                    $lookup: {
                        from: "students",
                        localField: "studentId",
                        foreignField: "_id",
                        as: "student",
                    },
                },
                { $unwind: "$student" },
                { $match: { "student.standard": standard } },
                {
                    $group: {
                        _id: null,
                        collected: { $sum: "$amount" },
                    },
                },
            ]);

            const collected = payments.length > 0 ? payments[0].collected : 0;

            const pending = totalFee - collected;

            results.push({
                standard,
                students,
                totalFee,
                collected,
                pending,
            });
        }

        res.json({ data: results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
