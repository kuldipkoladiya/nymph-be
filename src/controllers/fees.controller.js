import FeeStructure from "../models/fees.model.js";
import Payment from "../models/payment.model.js";
import Student from "../models/student.model.js";
import {generateFeeReceiptPDF} from "../utils/receiptPdf.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const setYearlyFee = asyncHandler(async (req, res) => {
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
});

export const getAllFeeStructures = asyncHandler(async (req, res) => {
    const structures = await FeeStructure.find().sort({ standard: 1 });
    res.json(structures);
});

export const deleteFeeStructure = asyncHandler(async (req, res) => {
    const fee = await FeeStructure.findByIdAndDelete(req.params.id);
    if (!fee) {
        res.status(404);
        throw new Error("Fee structure not found");
    }
    res.json({ message: "Fee structure deleted" });
});

export const getStudentFeeStatus = asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
        res.status(404);
        throw new Error("Student not found");
    }

    const structure = await FeeStructure.findOne({ standard: student.standard });
    if (!structure) {
        res.status(404);
        throw new Error("Fee structure missing for this standard");
    }

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
});

export const recordFeePayment = asyncHandler(async (req, res) => {
    const { studentId, amount, paymentMode, note } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
        res.status(404);
        throw new Error("Student not found");
    }

    const receiptNo = "REC-" + Math.floor(100000 + Math.random() * 900000);

    const payment = await Payment.create({
        studentId,
        amount,
        paymentMode,
        note,
        receiptNo,
    });

    res.json({ message: "Payment recorded", payment });
});

export const getPendingFeesStudents = asyncHandler(async (req, res) => {
    const { standard } = req.query; // optional filter

    const matchStage = standard ? { $match: { standard } } : { $match: {} };

    const pipelineResult = await Student.aggregate([
        matchStage,
        {
            $lookup: {
                from: "feestructures",
                localField: "standard",
                foreignField: "standard",
                as: "feeStructure"
            }
        },
        {
            $unwind: { path: "$feeStructure", preserveNullAndEmptyArrays: true }
        },
        {
            $lookup: {
                from: "payments",
                localField: "_id",
                foreignField: "studentId",
                as: "payments"
            }
        },
        {
            $addFields: {
                totalPaid: { $sum: "$payments.amount" },
                otherFeesTotal: { $sum: "$feeStructure.otherFees.amount" },
                yearlyFee: { $ifNull: ["$feeStructure.yearlyFee", 0] }
            }
        },
        {
            $addFields: {
                totalFee: { $add: ["$yearlyFee", "$otherFeesTotal"] }
            }
        },
        {
            $addFields: {
                remaining: { $subtract: ["$totalFee", "$totalPaid"] }
            }
        },
        {
            $match: {
                remaining: { $gt: 0 }
            }
        },
        {
            $project: {
                studentId: "$_id",
                name: 1,
                rollNumber: 1,
                standard: 1,
                totalFee: 1,
                totalPaid: 1,
                remaining: 1,
                status: {
                    $cond: {
                        if: { $lte: ["$remaining", 0] },
                        then: "Fully Paid",
                        else: {
                            $cond: {
                                if: { $eq: ["$totalPaid", 0] },
                                then: "Not Paid",
                                else: "Partially Paid"
                            }
                        }
                    }
                }
            }
        },
        {
            $sort: { remaining: -1 }
        }
    ]);

    const result = pipelineResult.map(item => ({
        ...item,
        percentagePaid: item.totalFee === 0 ? "0.00" : ((item.totalPaid / item.totalFee) * 100).toFixed(2)
    }));

    res.json(result);
});



export const addPayment = asyncHandler(async (req, res) => {
    const { studentId, amount } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
        res.status(404);
        throw new Error("Student not found");
    }

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
});

export const updatePayment = asyncHandler(async (req, res) => {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) {
        res.status(404);
        throw new Error("Payment record not found");
    }
    res.json({ message: "Payment updated", payment });
});

export const deletePayment = asyncHandler(async (req, res) => {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
        res.status(404);
        throw new Error("Payment record not found");
    }
    res.json({ message: "Payment record deleted" });
});

export const getAllPayments = asyncHandler(async (req, res) => {
    const payments = await Payment.find().populate("studentId").sort({ createdAt: -1 });
    res.json(payments);
});

