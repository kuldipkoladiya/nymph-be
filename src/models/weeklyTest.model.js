import mongoose from "mongoose";

const weeklyTestSchema = new mongoose.Schema(
    {
        testName: { type: String, required: true },   // e.g., Weekly Test 1
        standard: { type: String, required: true },   // 1,2,3,4...
        testDate: { type: Date, required: true },

        // Array of results for each student
        results: [
            {
                studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
                studentName: String,
                rollNumber: Number,
                marks: [
                    {
                        subject: String,
                        totalMarks: Number,
                        obtainedMarks: Number
                    }
                ]
            }
        ]
    },
    { timestamps: true }
);

export default mongoose.model("WeeklyTest", weeklyTestSchema);
