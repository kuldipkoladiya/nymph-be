import Student from "../models/student.model.js";
import cloudinary from "../config/cloudinary.js";
import * as streakier from "streamifier";

export const createStudent = async (req, res) => {
    try {
        const data = req.body;

        // if (req.file) {
        //     const uploadStream = cloudinary.uploader.upload_stream(
        //         { folder: "students" },
        //         (error, result) => {
        //             if (error) return res.status(500).json({ error: error.message });
        //
        //             data.image = result.secure_url;
        //             data.imageId = result.public_id;
        //
        //             // after upload → save student
        //             Student.create(data).then(student => {
        //                 res.status(201).json({ message: "Student created", student });
        //             });
        //         }
        //     );
        //
        //     streakier.createReadStream(req.file.buffer).pipe(uploadStream);
        //     return;
        // }

        // without image
        const student = await Student.create(data);
        res.status(201).json({ message: "Student created", student });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getStudents = async (req, res) => {
    try {
        const { standard, section, search } = req.query;

        const filter = {};

        if (standard) filter.standard = standard;
        if (section) filter.section = section;

        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        const students = await Student.find(filter).sort({ createdAt: -1 });

        res.json(students);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET ONE STUDENT
export const getStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: "Not found" });

        res.json(student);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE STUDENT
export const updateStudent = async (req, res) => {
    try {
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

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE STUDENT
export const deleteStudent = async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getStudentsByStandard = async (req, res) => {
    try {
        const students = await Student.find({ standard: req.params.standard })
            .select("name rollNumber _id");

        res.json({ students });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
