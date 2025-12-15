import FeeStructure from "../models/fees.model.js";
import Payment from "../models/payment.model.js";
import Student from "../models/student.model.js";

export const getFeesAnalytics = async (req, res) => {
    try {
        // 1️⃣ TOTAL STUDENTS
        const totalStudents = await Student.countDocuments();

        // 2️⃣ TOTAL YEARLY FEES (ALL STUDENTS)
        const students = await Student.find({});
        const feeStructures = await FeeStructure.find({});

        let totalYearlyFees = 0;

        for (let student of students) {
            const fs = feeStructures.find(
                (f) => f.standard === student.standard
            );
            if (fs) {
                const other = fs.otherFees.reduce((s, f) => s + f.amount, 0);
                totalYearlyFees += fs.yearlyFee + other;
            }
        }

        // 3️⃣ TOTAL FEES COLLECTED
        const payments = await Payment.find({});
        const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

        // 4️⃣ TOTAL PENDING
        const totalPending = totalYearlyFees - totalCollected;

        // 5️⃣ STANDARD-WISE COLLECTION
        const standardWise = await Payment.aggregate([
            {
                $lookup: {
                    from: "students",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "student",
                },
            },
            { $unwind: "$student" },
            {
                $group: {
                    _id: "$student.standard",
                    total: { $sum: "$amount" },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // 6️⃣ TOP 10 PENDING STUDENTS
        const studentStatusList = [];

        for (let student of students) {
            const fs = feeStructures.find((f) => f.standard === student.standard);
            if (!fs) continue;

            const otherFees = fs.otherFees.reduce((s, f) => s + f.amount, 0);
            const totalFee = fs.yearlyFee + otherFees;

            const studentPayments = payments.filter(
                (p) => p.studentId.toString() === student._id.toString()
            );

            const paid = studentPayments.reduce((s, p) => s + p.amount, 0);

            const remaining = totalFee - paid;

            studentStatusList.push({
                student,
                totalFee,
                totalPaid: paid,
                remaining,
            });
        }

        const topPendingStudents = studentStatusList
            .sort((a, b) => b.remaining - a.remaining)
            .slice(0, 10);

        // 7️⃣ TODAY’S PAYMENTS
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysPayments = await Payment.aggregate([
            {
                $match: {
                    createdAt: { $gte: today },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ]);

        const todayCollected = todaysPayments[0]?.total || 0;

        // 8️⃣ PAYMENT MODES STATS
        const paymentModeStats = await Payment.aggregate([
            {
                $group: {
                    _id: "$paymentMode",
                    total: { $sum: 1 },
                },
            },
        ]);

        res.json({
            totalStudents,
            totalYearlyFees,
            totalCollected,
            totalPending,

            standardWise,
            topPendingStudents,
            todayCollected,
            paymentModeStats,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
