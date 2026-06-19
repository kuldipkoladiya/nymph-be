import Student from "../models/student.model.js";
import cloudinary from "../config/cloudinary.js";
import * as streakier from "streamifier";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createStudent = asyncHandler(async (req, res) => {
    const data = req.body;

    // Check if rollNumber already exists in the same standard
    if (data.rollNumber && data.standard) {
        const existing = await Student.findOne({ rollNumber: data.rollNumber, standard: data.standard });
        if (existing) {
            res.status(400);
            throw new Error(`Roll number ${data.rollNumber} already exists in Class ${data.standard}.`);
        }
    }

    // without image
    const student = await Student.create(data);
    res.status(201).json({ message: "Student created", student });
});

export const getStudents = asyncHandler(async (req, res) => {
    const { standard, section, search, page, limit, paginate } = req.query;

    const filter = {};

    if (standard) filter.standard = standard;
    if (section) filter.section = section;

    if (search) {
        filter.name = { $regex: search, $options: "i" };
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

    // Check if updating to a duplicate roll number in the same standard
    if (data.rollNumber || data.standard) {
        const currentStudent = await Student.findById(req.params.id);
        if (!currentStudent) {
            res.status(404);
            throw new Error("Student not found");
        }
        const rollToCheck = data.rollNumber !== undefined ? data.rollNumber : currentStudent.rollNumber;
        const stdToCheck = data.standard !== undefined ? data.standard : currentStudent.standard;

        const duplicate = await Student.findOne({
            rollNumber: rollToCheck,
            standard: stdToCheck,
            _id: { $ne: req.params.id }
        });
        if (duplicate) {
            res.status(400);
            throw new Error(`Roll number ${rollToCheck} already exists in Class ${stdToCheck}.`);
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
});
