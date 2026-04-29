import Student from "../models/student.model.js";
import cloudinary from "../config/cloudinary.js";
import * as streakier from "streamifier";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createStudent = asyncHandler(async (req, res) => {
    const data = req.body;

    // without image
    const student = await Student.create(data);
    res.status(201).json({ message: "Student created", student });
});

export const getStudents = asyncHandler(async (req, res) => {
    const { standard, section, search } = req.query;

    const filter = {};

    if (standard) filter.standard = standard;
    if (section) filter.section = section;

    if (search) {
        filter.name = { $regex: search, $options: "i" };
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
    const students = await Student.find({ standard: req.params.standard })
        .select("name rollNumber _id");

    res.json({ students });
});
