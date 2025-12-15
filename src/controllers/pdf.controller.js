import Student from "../models/student.model.js";
import Result from "../models/result.model.js";
import pdf from "html-pdf-node";
import {generateResultHTML} from "../utils/resultTemplate.js";
import mongoose from "mongoose";

export const generateResultPDF = async (req, res) => {
    try {
        const { studentId, examId } = req.params;

        const student = await Student.findById(studentId);
        const result = await Result.findById(examId);

        if (!student || !result) {
            return res.status(404).json({ error: "Student or result not found" });
        }

        const html = generateResultHTML(student, result);

        const pdfOptions = { format: "A4" };
        const file = { content: html };

        const pdfBuffer = await pdf.generatePdf(file, pdfOptions);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${student.name}_result.pdf"`,
        });

        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
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