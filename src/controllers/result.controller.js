import Result from "../models/result.model.js";
import Student from "../models/student.model.js";
import {calculateGrade} from "../utils/calcGrade.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResultPDF } from "../utils/ResultPDF.js";
import { MonthlyResultPDF } from "../utils/MonthlyResultPDF.js";
import { sendResultWhatsApp, sendTextWhatsApp, getWhatsAppStatus } from "../utils/whatsappSender.js";


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

export const getMonthlyReport = asyncHandler(async (req, res) => {
    const { standard, month, year, section } = req.query;

    if (!standard || !month || !year) {
        res.status(400);
        throw new Error("standard, month, and year are required");
    }

    const studentFilter = { standard };
    if (section) {
        studentFilter.section = section;
    }
    const students = await Student.find(studentFilter).lean();
    const studentIds = students.map(s => s._id);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const results = await Result.find({
        studentId: { $in: studentIds },
        examDate: { $gte: startDate, $lte: endDate }
    }).lean();

    const report = students.map(student => {
        const studentResults = results.filter(r => r.studentId.toString() === student._id.toString());
        
        let totalObtained = 0;
        let totalMaximum = 0;
        const examCount = studentResults.length;

        studentResults.forEach(r => {
            totalObtained += r.totalObtained || 0;
            totalMaximum += r.totalMaximum || 0;
        });

        const percentage = totalMaximum > 0 ? Number(((totalObtained / totalMaximum) * 100).toFixed(2)) : 0;
        const grade = totalMaximum > 0 ? calculateGrade(percentage) : "N/A";

        return {
            student,
            totalObtained,
            totalMaximum,
            percentage,
            grade,
            examCount,
            results: studentResults
        };
    });

    res.json({
        standard,
        month: parseInt(month),
        year: parseInt(year),
        report
    });
});

export const sendMonthlyWhatsApp = asyncHandler(async (req, res) => {
    const { studentId, month, year, totalObtained, totalMaximum, percentage, grade, examCount } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
        res.status(404);
        throw new Error("Student not found");
    }

    if (!student.phone) {
        res.status(400);
        throw new Error(`Student ${student.name} does not have a phone number configured.`);
    }

    const dateString = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const messageBody = `Dear Parent,\n\nHere is the Monthly Performance Report of your ward, *${student.name}* (Roll No: *${student.rollNumber}*), for *${dateString}* at Nymph Classes:\n\n• Total Exams: ${examCount}\n• Total Marks: ${totalObtained} / ${totalMaximum}\n• Overall Percentage: ${percentage}%\n• Monthly Grade: ${grade}\n\nBest regards,\nNymph Classes`;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const results = await Result.find({
        studentId,
        examDate: { $gte: startDate, $lte: endDate }
    }).lean();

    const MONTHS = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const monthLabel = MONTHS[parseInt(month) - 1] || "Selected Month";

    const report = {
        totalObtained,
        totalMaximum,
        percentage,
        grade,
        examCount,
        results
    };

    const element = React.createElement(MonthlyResultPDF, {
        student,
        monthLabel,
        year: parseInt(year),
        report
    });

    const buffer = await renderToBuffer(element);
    const filename = `${student.name.replace(/\s+/g, "_")}_${monthLabel}_${year}_Monthly_Report.pdf`;

    const sendResult = await sendResultWhatsApp(student.phone, buffer, filename, messageBody);

    if (!sendResult.success) {
        res.status(500);
        throw new Error(sendResult.error);
    }

    res.json({ success: true, message: "WhatsApp message sent successfully!" });
});

export const sendMonthlyWhatsAppBulk = asyncHandler(async (req, res) => {
    const { standard, month, year, section } = req.body;

    if (!standard || !month || !year) {
        res.status(400);
        throw new Error("standard, month, and year are required");
    }

    const studentFilter = { standard };
    if (section) {
        studentFilter.section = section;
    }
    const students = await Student.find(studentFilter).lean();
    const studentIds = students.map(s => s._id);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const results = await Result.find({
        studentId: { $in: studentIds },
        examDate: { $gte: startDate, $lte: endDate }
    }).lean();

    const dateString = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const MONTHS = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const monthLabel = MONTHS[parseInt(month) - 1] || "Selected Month";

    // Send messages sequentially to prevent CPU/memory spikes and WhatsApp account bans
    const reportResults = [];
    for (const student of students) {
        if (!student.phone) {
            reportResults.push({ student: student.name, success: false, error: "No phone number" });
            continue;
        }

        const studentResults = results.filter(r => r.studentId.toString() === student._id.toString());
        
        let totalObtained = 0;
        let totalMaximum = 0;
        const examCount = studentResults.length;

        studentResults.forEach(r => {
            totalObtained += r.totalObtained || 0;
            totalMaximum += r.totalMaximum || 0;
        });

        const percentage = totalMaximum > 0 ? Number(((totalObtained / totalMaximum) * 100).toFixed(2)) : 0;
        const grade = totalMaximum > 0 ? calculateGrade(percentage) : "N/A";

        const messageBody = `Dear Parent,\n\nHere is the Monthly Performance Report of your ward, *${student.name}* (Roll No: *${student.rollNumber}*), for *${dateString}* at Nymph Classes:\n\n• Total Exams: ${examCount}\n• Total Marks: ${totalObtained} / ${totalMaximum}\n• Overall Percentage: ${percentage}%\n• Monthly Grade: ${grade}\n\nBest regards,\nNymph Classes`;

        const report = {
            totalObtained,
            totalMaximum,
            percentage,
            grade,
            examCount,
            results: studentResults
        };

        try {
            const element = React.createElement(MonthlyResultPDF, {
                student,
                monthLabel,
                year: parseInt(year),
                report
            });
            const buffer = await renderToBuffer(element);
            const filename = `${student.name.replace(/\s+/g, "_")}_${monthLabel}_${year}_Monthly_Report.pdf`;

            const sendResult = await sendResultWhatsApp(student.phone, buffer, filename, messageBody);
            reportResults.push({ student: student.name, success: sendResult.success, error: sendResult.error });
        } catch (err) {
            reportResults.push({ student: student.name, success: false, error: err.message });
        }

        // Delay 2.5 seconds between each message
        await new Promise(resolve => setTimeout(resolve, 2500));
    }

    res.json({ success: true, message: "Bulk WhatsApp messages completed!", report: reportResults });
});
