import Student from "../models/student.model.js";
import Attendance from "../models/attendance.model.js";
import Result from "../models/result.model.js";
import FeeStructure from "../models/fees.model.js";
import Payment from "../models/payment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
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
        averagePercentage: Math.min(averagePercentage, 100),
        topStudents: topStudents.map(s => ({
            ...s._doc,
            percentage: Math.min(s.percentage, 100)
        })),
        failCount
    });
});

export const getStandardWiseFeeStats = asyncHandler(async (req, res) => {
    const standards = await FeeStructure.find();

    // Get student count per standard
    const studentCounts = await Student.aggregate([
        { $group: { _id: "$standard", count: { $sum: 1 } } }
    ]);
    const studentCountMap = {};
    studentCounts.forEach(sc => studentCountMap[sc._id] = sc.count);

    // Get total payments per standard
    const standardPayments = await Payment.aggregate([
        {
            $lookup: {
                from: "students",
                localField: "studentId",
                foreignField: "_id",
                as: "student"
            }
        },
        { $unwind: "$student" },
        {
            $group: {
                _id: "$student.standard",
                collected: { $sum: "$amount" }
            }
        }
    ]);
    const paymentMap = {};
    standardPayments.forEach(sp => paymentMap[sp._id] = sp.collected);

    const results = standards.map(std => {
        const { standard, yearlyFee, otherFees } = std;
        const students = studentCountMap[standard] || 0;
        const otherFeeTotal = otherFees.reduce((sum, f) => sum + f.amount, 0);
        const totalFeePerStudent = yearlyFee + otherFeeTotal;
        const totalFee = totalFeePerStudent * students;
        const collected = paymentMap[standard] || 0;
        const pending = totalFee - collected;

        return {
            standard,
            students,
            totalFee,
            collected,
            pending,
        };
    });

    res.json({ data: results });
});
