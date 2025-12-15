import FeeStructure from "../models/fees.model.js";
import Payment from "../models/payment.model.js";
import Student from "../models/student.model.js";
import {generateFeeReceiptPDF} from "../utils/receiptPdf.js";

export const setYearlyFee = async (req, res) => {
    try {
        const { standard, yearlyFee, otherFees } = req.body;

        const existing = await FeeStructure.findOne({ standard });

        if (existing) {
            existing.yearlyFee = yearlyFee;
            existing.otherFees = otherFees || [];
            await existing.save();

            return res.json({ message: "Yearly fee updated", fee: existing });
        }

        const fee = await FeeStructure.create({
            standard,
            yearlyFee,
            otherFees: otherFees || []
        });

        res.json({ message: "Yearly fee created", fee });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getStudentFeeStatus = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findById(studentId);
        if (!student)
            return res.status(404).json({ error: "Student not found" });

        const structure = await FeeStructure.findOne({ standard: student.standard });
        if (!structure)
            return res.status(404).json({ error: "Fee structure missing for this standard" });

        const payments = await Payment.find({ studentId });

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        const otherFeesTotal = structure.otherFees.reduce(
            (sum, f) => sum + f.amount,
            0
        );

        const yearlyTotal = structure.yearlyFee + otherFeesTotal;

        const remaining = yearlyTotal - totalPaid;

        res.json({
            student,
            yearlyFee: structure.yearlyFee,
            otherFees: structure.otherFees,
            totalYearlyFee: yearlyTotal,

            totalPaid,
            remaining,
            isFullyPaid: remaining <= 0,

            paymentHistory: payments,
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const recordFeePayment = async (req, res) => {
    try {
        const { studentId, amount, paymentMode, note } = req.body;

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ error: "Student not found" });

        const receiptNo = "REC-" + Math.floor(100000 + Math.random() * 900000);

        const payment = await Payment.create({
            studentId,
            amount,
            paymentMode,
            note,
            receiptNo,
        });

        res.json({ message: "Payment recorded", payment });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPendingFeesStudents = async (req, res) => {
    try {
        const { standard } = req.query; // optional filter

        // 1️⃣ FETCH STUDENTS (with optional standard filter)
        const query = standard ? { standard } : {};
        const students = await Student.find(query);

        const structures = await FeeStructure.find({});
        const payments = await Payment.find({});

        const result = [];

        for (let s of students) {
            const feeStructure = structures.find((f) => f.standard === s.standard);

            if (!feeStructure) continue;

            const otherFees = feeStructure.otherFees.reduce(
                (sum, f) => sum + f.amount,
                0
            );

            const totalFee = feeStructure.yearlyFee + otherFees;

            const studentPayments = payments.filter(
                (p) => p.studentId.toString() === s._id.toString()
            );

            const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);

            const remaining = totalFee - totalPaid;

            if (remaining > 0) {
                result.push({
                    studentId: s._id,
                    name: s.name,
                    rollNumber: s.rollNumber,
                    standard: s.standard,

                    totalFee,
                    totalPaid,
                    remaining,

                    status:
                        remaining <= 0
                            ? "Fully Paid"
                            : totalPaid === 0
                                ? "Not Paid"
                                : "Partially Paid",

                    percentagePaid: ((totalPaid / totalFee) * 100).toFixed(2),
                });
            }
        }

        // Sort by largest pending amount
        result.sort((a, b) => b.remaining - a.remaining);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



export const addPayment = async (req, res) => {
    try {
        const { studentId, amount } = req.body;

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ error: "Student not found" });

        const feeStructure = await FeeStructure.findOne({
            standard: student.standard,
        });

        const otherFees = feeStructure.otherFees.reduce(
            (sum, f) => sum + f.amount,
            0
        );

        const totalFee = feeStructure.yearlyFee + otherFees;

        const payments = await Payment.find({ studentId });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        const remaining = totalFee - (totalPaid + amount);

        const payment = await Payment.create({
            studentId,
            amount,
            date: new Date(),
        });

        // CREATE PDF RECEIPT
        const pdfUrl = await generateFeeReceiptPDF(student, payment, {
            yearlyFee: feeStructure.yearlyFee,
            otherFees,
            totalFee,
            totalPaid: totalPaid + amount,
            remaining,
        });

        res.json({
            message: "Payment added successfully",
            payment,
            receiptPdf: pdfUrl,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

