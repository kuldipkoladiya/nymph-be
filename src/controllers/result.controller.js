import Result from "../models/result.model.js";
import Student from "../models/student.model.js";
import {calculateGrade} from "../utils/calcGrade.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResultPDF } from "../utils/ResultPDF.js";
import { sendResultWhatsApp, getWhatsAppStatus } from "../utils/whatsappSender.js";


export const createResult = asyncHandler(async (req, res) => {
    const { studentId, examName, standard, subjects,examDate  } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
        res.status(404);
        throw new Error("Student not found");
    }

    let totalObtained = 0;
    let totalMaximum = 0;

    subjects.forEach((s) => {
        totalObtained += Number(s.marksObtained);
        totalMaximum += Number(s.totalMarks);
    });

    let percentage = Number(((totalObtained / totalMaximum) * 100).toFixed(2));
    if (percentage > 100) percentage = 100;
    const grade = calculateGrade(percentage);

    const result = await Result.create({
        studentId,
        examName,
        standard,
        subjects,
        examDate,
        totalObtained,
        totalMaximum,
        percentage,
        grade
    });

    res.status(201).json({ message: "Result created", result });

    // Send WhatsApp Result PDF in background if sendWhatsApp is checked
    if (req.body.sendWhatsApp) {
        (async () => {
            try {
                if (!getWhatsAppStatus()) {
                    console.warn(`⚠️ [WhatsApp] Cannot send automated WhatsApp result for ${student.name}. Client is not ready.`);
                    return;
                }
                if (!student.phone) {
                    console.warn(`⚠️ [WhatsApp] Student ${student.name} has no phone number configured.`);
                    return;
                }

                // Render PDF to buffer
                const element = React.createElement(ResultPDF, {
                    student,
                    result,
                });
                const buffer = await renderToBuffer(element);

                const filename = `${student.name.replace(/\s+/g, "_")}_${result.examName.replace(/\s+/g, "_")}_Result.pdf`;

                const subjectsText = result.subjects
                    .map((s) => `• *${s.name}*: ${s.marksObtained}/${s.totalMarks}`)
                    .join("\n");

                const messageBody = `Hello *${student.name}*,\n\nYour result for *${result.examName}* (Standard ${student.standard}) has been published:\n\n*Scores:*\n${subjectsText}\n\n*Total:* ${result.totalObtained} / ${result.totalMaximum}\n*Percentage:* ${result.percentage}%\n*Grade:* ${result.grade}\n\nPlease find your detailed scorecard PDF attached below.\n\nBest regards,\nNymph Classes`;

                await sendResultWhatsApp(student.phone, buffer, filename, messageBody);
            } catch (err) {
                console.error("❌ [WhatsApp] Background send error:", err);
            }
        })();
    }
});

export const updateResult = asyncHandler(async (req, res) => {
    const { subjects ,examDate } = req.body;

    let updateData = req.body;
    if (examDate) {
        updateData.examDate = examDate;   // ✅ ADD THIS
    }
    if (subjects) {
        let totalObtained = 0;
        let totalMaximum = 0;

        subjects.forEach((s) => {
            totalObtained += Number(s.marksObtained);
            totalMaximum += Number(s.totalMarks);
        });

        updateData.totalObtained = totalObtained;
        updateData.totalMaximum = totalMaximum;
        let percentage = Number(((totalObtained / totalMaximum) * 100).toFixed(2));
        if (percentage > 100) percentage = 100;
        updateData.percentage = percentage;
        updateData.grade = calculateGrade(updateData.percentage);
    }

    const result = await Result.findByIdAndUpdate(req.params.id, updateData, {
        new: true
    });

    res.json({ message: "Result updated", result });
});

export const getStudentResults = asyncHandler(async (req, res) => {
    const results = await Result.find({ studentId: req.params.id }).populate("studentId");
    res.json(results);
});

export const deleteResult = asyncHandler(async (req, res) => {
    await Result.findByIdAndDelete(req.params.id);
    res.json({ message: "Result deleted" });
});
