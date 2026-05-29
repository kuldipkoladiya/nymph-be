import { renderToBuffer } from "@react-pdf/renderer";
import { ResultPDF } from "../utils/ResultPDF.js";
import Student from "../models/student.model.js";
import Result from "../models/result.model.js";
import mongoose from "mongoose";
import React from "react";
import { sendResultWhatsApp, getWhatsAppStatus, getWhatsAppQR } from "../utils/whatsappSender.js";

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

        if (!Array.isArray(result.subjects)) {
            return res.status(400).json({
                error: "Invalid result data",
            });
        }

        const element = React.createElement(ResultPDF, {
            student,
            result,
        });

        const buffer = await renderToBuffer(element);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${student.name}_result.pdf"`
        );

        return res.send(buffer);
    } catch (err) {
        return res.status(500).json({
            error: "PDF generation failed",
        });
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

export const sendResultWhatsAppController = async (req, res) => {
    try {
        const { studentId, examId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(studentId) ||
            !mongoose.Types.ObjectId.isValid(examId)
        ) {
            return res.status(400).json({ success: false, error: "Invalid ID" });
        }

        if (!getWhatsAppStatus()) {
            return res.status(400).json({
                success: false,
                error: "WhatsApp Web is not authenticated. Please scan the QR code in the server terminal first.",
            });
        }

        const student = await Student.findById(studentId).lean();
        const result = await Result.findById(examId).lean();

        if (!student || !result) {
            return res.status(404).json({ success: false, error: "Data not found" });
        }

        if (!student.phone) {
            return res.status(400).json({
                success: false,
                error: `Student ${student.name} does not have a phone number configured.`,
            });
        }

        if (!Array.isArray(result.subjects)) {
            return res.status(400).json({
                success: false,
                error: "Invalid result data",
            });
        }

        // Generate PDF Buffer
        const element = React.createElement(ResultPDF, {
            student,
            result,
        });
        const buffer = await renderToBuffer(element);

        const filename = `${student.name.replace(/\s+/g, "_")}_${result.examName.replace(/\s+/g, "_")}_Result.pdf`;
        
        // Format subjects text
        const subjectsText = result.subjects
            .map((s) => `• *${s.name}*: ${s.marksObtained}/${s.totalMarks}`)
            .join("\n");

        const messageBody = `Hello *${student.name}*,\n\nYour result for *${result.examName}* (Standard ${student.standard}) has been published:\n\n*Scores:*\n${subjectsText}\n\n*Total:* ${result.totalObtained} / ${result.totalMaximum}\n*Percentage:* ${result.percentage}%\n*Grade:* ${result.grade}\n\nPlease find your detailed scorecard PDF attached below.\n\nBest regards,\nNymph Classes`;

        // Send via WhatsApp
        const sendResult = await sendResultWhatsApp(student.phone, buffer, filename, messageBody);

        if (!sendResult.success) {
            return res.status(500).json({
                success: false,
                error: sendResult.error,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Result PDF sent successfully via WhatsApp!",
            messageId: sendResult.messageId
        });
    } catch (err) {
        console.error("WhatsApp Controller Error:", err);
        return res.status(500).json({
            success: false,
            error: err.message || "Failed to generate result PDF or send WhatsApp message.",
        });
    }
};

export const getWhatsAppStatusController = (req, res) => {
    try {
        const isReady = getWhatsAppStatus();
        const qr = getWhatsAppQR();

        if (isReady) {
            return res.status(200).json({ 
                success: true,
                status: "authenticated", 
                message: "WhatsApp is ready and connected!" 
            });
        }

        if (qr) {
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
            return res.status(200).json({ 
                success: true,
                status: "scan_required", 
                qrCodeUrl,
                message: "Scan this QR code with WhatsApp Linked Devices" 
            });
        }

        return res.status(200).json({ 
            success: true,
            status: "initializing", 
            message: "WhatsApp client is initializing. Please refresh in a few seconds." 
        });
    } catch (error) {
        console.error("getWhatsAppStatusController Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to retrieve WhatsApp status."
        });
    }
};