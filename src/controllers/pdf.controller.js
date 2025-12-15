import { pdf } from "@react-pdf/renderer";
import { ResultPDF } from "../utils/ResultPDF.js";
import Student from "../models/student.model.js";
import Result from "../models/result.model.js";
import mongoose from "mongoose";

export const generateResultPDF = async (req, res) => {
    try {
        const { studentId, examId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(studentId) ||
            !mongoose.Types.ObjectId.isValid(examId)
        ) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const student = await Student.findById(studentId).lean();
        const result = await Result.findById(examId).lean();

        if (!student || !result) {
            return res.status(404).json({ error: "Data not found" });
        }

        const element = React.createElement(ResultPDF, {
            student,
            result,
        });

        const buffer = await pdf(element).toBuffer();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${student.name}_result.pdf"`
        );

        res.send(buffer);
    } catch (err) {
        console.error("PDF ERROR:", err);
        res.status(500).json({ error: "PDF generation failed" });
    }
};


export const getResultById = async (req, res) => {
    try {
        const { resultId } = req.params;

        // ✅ Validate Mongo ObjectId
        if (!mongoose.Types.ObjectId.isValid(resultId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid result ID",
            });
        }

        const result = await Result.findById(resultId)
            .populate("studentId", "name standard") // optional
            .lean();

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Result not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Get Result By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};