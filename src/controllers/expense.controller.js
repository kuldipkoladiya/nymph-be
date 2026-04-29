import Expense from "../models/expense.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ADD EXPENSE
export const addExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.create(req.body);
    res.json({ message: "Expense added", expense });
});

// GET ALL EXPENSES (Filter by month/year)
export const getExpenses = asyncHandler(async (req, res) => {
    const { month, year } = req.query;

    const filter = {};

    if (month && year) {
        filter.date = {
            $gte: new Date(year, month - 1, 1),
            $lte: new Date(year, month, 0),
        };
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json({ expenses });
});

// UPDATE EXPENSE
export const updateExpense = asyncHandler(async (req, res) => {
    const updated = await Expense.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );
    res.json({ message: "Expense updated", updated });
});

// DELETE EXPENSE
export const deleteExpense = asyncHandler(async (req, res) => {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Expense deleted" });
});

// SUMMARY (Analytics)
export const expenseSummary = asyncHandler(async (req, res) => {
    const summary = await Expense.aggregate([
        {
            $group: {
                _id: "$category",
                totalSpent: { $sum: "$amount" },
                count: { $sum: 1 },
            },
        },
        { $sort: { totalSpent: -1 } },
    ]);

    const totalExpenses = await Expense.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
        summary,
        totalExpenses: totalExpenses[0]?.total || 0,
    });
});
