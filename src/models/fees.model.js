import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema(
    {
        standard: { type: String, required: true, unique: true },
        yearlyFee: { type: Number, required: true }, // 👈 Only yearly fee
        otherFees: [
            {
                title: String,
                amount: Number,
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model("FeeStructure", feeStructureSchema);
