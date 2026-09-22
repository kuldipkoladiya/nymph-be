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

    // Sort students numerically by roll number
    students.sort((a, b) => {
        const rollA = parseInt(a.rollNumber) || 0;
        const rollB = parseInt(b.rollNumber) || 0;
        return rollA - rollB;
    });

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

export const bulkUpdateStudents = asyncHandler(async (req, res) => {
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
        res.status(400);
        throw new Error("students array is required");
    }

    const studentIds = students.map(s => s._id).filter(Boolean);
    if (studentIds.length === 0) {
        res.status(400);
        throw new Error("No valid student IDs provided");
    }

    // Fetch existing student records
    const existingStudents = await Student.find({ _id: { $in: studentIds } });
    const existingMap = new Map(existingStudents.map(s => [s._id.toString(), s]));

    // 1. Prepare updates and check for duplicates within the submitted batch
    const plannedUpdates = [];
    const seenInBatch = new Map();

    for (const item of students) {
        const idStr = item._id?.toString();
        const current = existingMap.get(idStr);
        if (!current) continue;

        const roll = item.rollNumber !== undefined ? String(item.rollNumber).trim() : String(current.rollNumber).trim();
        const std = item.standard !== undefined ? String(item.standard).trim() : String(current.standard).trim();
        const sec = item.section !== undefined ? String(item.section).trim() : (current.section ? String(current.section).trim() : "");
        const studentName = (item.name || current.name || "").trim();

        // Check for duplicate roll numbers WITHIN this submitted batch
        const classKey = `${std}__${sec}__${roll}`;
        if (seenInBatch.has(classKey)) {
            const conflictingName = seenInBatch.get(classKey);
            res.status(400);
            throw new Error(`Duplicate roll number "${roll}" assigned to multiple students in Class ${std}${sec ? ` (${sec})` : ""} ("${conflictingName}" and "${studentName}"). Each student must have a unique roll number.`);
        }
        seenInBatch.set(classKey, studentName);

        const { _id, ...otherFields } = item;
        plannedUpdates.push({
            _id: current._id,
            targetFields: {
                ...otherFields,
                rollNumber: roll,
                standard: std,
                ...(sec ? { section: sec } : {})
            },
            current,
            roll,
            std,
            sec,
            name: studentName
        });
    }

    // 2. Validate against existing students OUTSIDE this batch
    for (const update of plannedUpdates) {
        const query = {
            rollNumber: update.roll,
            standard: update.std,
            _id: { $nin: studentIds }
        };
        if (update.sec) {
            query.section = update.sec;
        } else {
            query.$or = [{ section: { $exists: false } }, { section: null }, { section: "" }];
        }

        const collision = await Student.findOne(query);
        if (collision) {
            res.status(400);
            throw new Error(`Roll number ${update.roll} already exists in Class ${update.std}${update.sec ? ` (${update.sec})` : ""} for student "${collision.name}".`);
        }
    }

    // 3. Two-phase update to prevent MongoDB unique index collisions:
    // If students in this batch swap or shift roll numbers (e.g. roll 5 -> 6 and roll 6 -> 7),
    // directly updating one-by-one causes MongoDB E11000 duplicate key error.
    // Phase 1 sets a unique temporary placeholder rollNumber for all students in the batch.
    const tempOps = plannedUpdates.map((update, idx) => ({
        updateOne: {
            filter: { _id: update._id },
            update: { $set: { rollNumber: `__tmp_${Date.now()}_${idx}_${update._id}` } }
        }
    }));
    await Student.bulkWrite(tempOps);

    // Phase 2: Apply final target fields to each student
    const finalOps = plannedUpdates.map(update => ({
        updateOne: {
            filter: { _id: update._id },
            update: { $set: update.targetFields }
        }
    }));

    try {
        await Student.bulkWrite(finalOps);
    } catch (writeErr) {
        // Rollback to original values if Phase 2 fails
        const rollbackOps = existingStudents.map(s => ({
            updateOne: {
                filter: { _id: s._id },
                update: {
                    $set: {
                        name: s.name,
                        rollNumber: s.rollNumber,
                        standard: s.standard,
                        section: s.section,
                        phone: s.phone,
                        secondPhone: s.secondPhone,
                        fatherName: s.fatherName,
                        motherName: s.motherName
                    }
                }
            }
        }));
        await Student.bulkWrite(rollbackOps).catch(() => {});
        throw writeErr;
    }

    const updatedStudents = await Student.find({ _id: { $in: studentIds } });
    res.json({ message: `Successfully updated ${updatedStudents.length} students`, students: updatedStudents });
});
