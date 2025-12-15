import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    marksObtained: { type: Number, required: true },
    totalMarks: { type: Number, required: true }
});

const resultSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        examName: { type: String, required: true }, // e.g Final Exam
        standard: { type: String, required: true },
        subjects: [subjectSchema],
        examDate: { type: Date, required: true },
        totalObtained: { type: Number },
        totalMaximum: { type: Number },
        percentage: { type: Number },
        grade: { type: String }
    },
    { timestamps: true }
);

export default mongoose.model("Result", resultSchema);
