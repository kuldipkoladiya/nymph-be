import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },          // e.g., Electricity Bill
        category: { type: String, required: true },       // e.g., Maintenance
        amount: { type: Number, required: true },         // e.g., 2500
        date: { type: Date, required: true },             // Expense date
        notes: { type: String },                          // Optional description
    },
    { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
