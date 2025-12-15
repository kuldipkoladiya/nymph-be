import WeeklyTest from "../models/weeklyTest.model.js";
import Student from "../models/student.model.js";

export const addWeeklyTest = async (req, res) => {
    try {
        const { testName, standard, testDate, students } = req.body;

        if (!students || students.length === 0) {
            return res.status(400).json({ error: "No student results provided" });
        }

        const results = [];

        for (const entry of students) {
            const student = await Student.findById(entry.studentId);

            if (student) {
                results.push({
                    studentId: student._id,
                    studentName: student.name,
                    rollNumber: student.rollNumber,
                    marks: entry.marks
                });
            }
        }

        const saveResult = await WeeklyTest.create({
            testName,
            standard,
            testDate,
            results
        });

        res.json({ message: "Weekly Test Saved", saveResult });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
