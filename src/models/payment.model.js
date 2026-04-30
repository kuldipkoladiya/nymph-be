import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },

        amount: { type: Number, required: true }, // paid amount
        paymentMode: { type: String, enum: ["Cash", "Online", "UPI", "Cheque", "Bank Transfer"], default: "Cash" },

        note: { type: String }, // optional remarks

        receiptNo: { type: String, required: true },
        receiptPdf: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
