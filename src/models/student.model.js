import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        rollNumber: { type: String, required: true },
        standard: { type: String, required: true },  // 1,2,3,4,5,6...
        section: { type: String },                   // A, B, C...
        fatherName: { type: String },
        motherName: { type: String },
        phone: { type: String },
        address: { type: String },
        dob: { type: String },
        image: { type: String },                     // URL or local path
    },
    { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
