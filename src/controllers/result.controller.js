import Result from "../models/result.model.js";
import Student from "../models/student.model.js";
import {calculateGrade} from "../utils/calcGrade.js";


export const createResult = async (req, res) => {
    try {
        const { studentId, examName, standard, subjects,examDate  } = req.body;

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: "Student not found" });

        let totalObtained = 0;
        let totalMaximum = 0;

        subjects.forEach((s) => {
            totalObtained += Number(s.marksObtained);
            totalMaximum += Number(s.totalMarks);
        });

        const percentage = Number(((totalObtained / totalMaximum) * 100).toFixed(2));
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

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const updateResult = async (req, res) => {
    try {
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
            updateData.percentage = Number(((totalObtained / totalMaximum) * 100).toFixed(2));
            updateData.grade = calculateGrade(updateData.percentage);
        }

        const result = await Result.findByIdAndUpdate(req.params.id, updateData, {
            new: true
        });

        res.json({ message: "Result updated", result });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getStudentResults = async (req, res) => {
    try {
        const results = await Result.find({ studentId: req.params.id }).populate("studentId");
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteResult = async (req, res) => {
    try {
        await Result.findByIdAndDelete(req.params.id);
        res.json({ message: "Result deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
