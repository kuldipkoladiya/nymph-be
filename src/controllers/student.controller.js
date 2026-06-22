import Student from "../models/student.model.js";
import cloudinary from "../config/cloudinary.js";
import * as streakier from "streamifier";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createStudent = asyncHandler(async (req, res) => {
    const data = req.body;

    // Check if rollNumber already exists in the same standard and section
    if (data.rollNumber && data.standard) {
        const query = { rollNumber: data.rollNumber, standard: data.standard };
        if (data.section) {
            query.section = data.section;
        }
        const existing = await Student.findOne(query);
        if (existing) {
            res.status(400);
            throw new Error(`Roll number ${data.rollNumber} already exists in Class ${data.standard}${data.section ? ` (${data.section})` : ""}.`);
        }
    }

    // without image
    const student = await Student.create(data);
    res.status(201).json({ message: "Student created", student });
});

export const getStudents = asyncHandler(async (req, res) => {
    const { standard, section, search, page, limit, paginate, academicYear } = req.query;

    const filter = {};

    if (search) {
        filter.name = { $regex: search, $options: "i" };
    }

    if (academicYear || standard || section) {
        const currentMatch = {};
        if (academicYear) currentMatch.academicYear = academicYear;
        if (standard) currentMatch.standard = standard;
        if (section) currentMatch.section = section;

        const historyMatch = {};
        if (academicYear) historyMatch.academicYear = academicYear;
        if (standard) historyMatch.standard = standard;
        if (section) historyMatch.section = section;

        filter.$or = [
            currentMatch,
            { academicHistory: { $elemMatch: historyMatch } }
        ];
    }

    if (paginate === "true") {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 15;
        const skip = (pageNum - 1) * limitNum;

        const students = await Student.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Student.countDocuments(filter);

        return res.json({
            students,
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalStudents: total
        });
    }

    const students = await Student.find(filter).sort({ createdAt: -1 });

    res.json(students);
});

// GET ONE STUDENT
export const getStudent = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) {
        res.status(404);
        throw new Error("Student not found");
    }

    res.json(student);
});

// UPDATE STUDENT
export const updateStudent = asyncHandler(async (req, res) => {
    const data = req.body;

    if (req.file) {
        data.image = "/uploads/students/" + req.file.filename;
    }

    // Check if updating to a duplicate roll number in the same standard and section
    if (data.rollNumber || data.standard || data.section) {
        const currentStudent = await Student.findById(req.params.id);
        if (!currentStudent) {
            res.status(404);
            throw new Error("Student not found");
        }
        const rollToCheck = data.rollNumber !== undefined ? data.rollNumber : currentStudent.rollNumber;
        const stdToCheck = data.standard !== undefined ? data.standard : currentStudent.standard;
        const secToCheck = data.section !== undefined ? data.section : currentStudent.section;

        const query = {
            rollNumber: rollToCheck,
            standard: stdToCheck,
            _id: { $ne: req.params.id }
        };
        if (secToCheck) {
            query.section = secToCheck;
        }

        const duplicate = await Student.findOne(query);
        if (duplicate) {
            res.status(400);
            throw new Error(`Roll number ${rollToCheck} already exists in Class ${stdToCheck}${secToCheck ? ` (${secToCheck})` : ""}.`);
        }
    }

    const student = await Student.findByIdAndUpdate(
        req.params.id,
        data,
        { new: true }
    );

    res.json({ message: "Updated", student });
});

// DELETE STUDENT
export const deleteStudent = asyncHandler(async (req, res) => {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

export const getStudentsByStandard = asyncHandler(async (req, res) => {
    const filter = { standard: req.params.standard };
    if (req.query.section) {
        filter.section = req.query.section;
    }
    const students = await Student.find(filter)
        .select("name rollNumber _id section");

    res.json({ students });
});export const bulkPromoteStudents = asyncHandler(async (req, res) => {
    const { studentIds, targetStandard, targetSection, targetAcademicYear } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400);
        throw new Error("studentIds array is required");
    }
    if (!targetStandard) {
        res.status(400);
        throw new Error("targetStandard is required");
    }

    // Process each student
    for (const id of studentIds) {
        const student = await Student.findById(id);
        if (!student) continue;

        const nextSection = targetSection !== undefined ? targetSection : student.section;

        // Check if the roll number already exists in target standard/section for another student
        const duplicate = await Student.findOne({
            rollNumber: student.rollNumber,
            standard: targetStandard,
            section: nextSection,
            _id: { $ne: student._id }
        });

        if (duplicate) {
            res.status(400);
            throw new Error(`Roll number ${student.rollNumber} already exists in Class ${targetStandard}${nextSection ? ` (${nextSection})` : ""} for another student (${duplicate.name}). Promotion aborted.`);
        }

        // Archive the current academic state before promoting
        const historyEntry = {
            academicYear: student.academicYear || "Pre-promotion",
            standard: student.standard,
            section: student.section,
            rollNumber: student.rollNumber,
            promotedAt: new Date()
        };

        if (!student.academicHistory) {
            student.academicHistory = [];
        }
        student.academicHistory.push(historyEntry);

        student.standard = targetStandard;
        if (targetSection !== undefined) {
            student.section = targetSection;
        }
        if (targetAcademicYear !== undefined) {
            student.academicYear = targetAcademicYear;
        }
        await student.save();
    }

    res.json({ message: `Successfully promoted ${studentIds.length} students to Standard ${targetStandard}` });
});
