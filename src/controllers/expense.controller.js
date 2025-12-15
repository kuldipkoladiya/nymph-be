import Expense from "../models/expense.model.js";

// ADD EXPENSE
export const addExpense = async (req, res) => {
    try {
        const expense = await Expense.create(req.body);
        res.json({ message: "Expense added", expense });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET ALL EXPENSES (Filter by month/year)
export const getExpenses = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE EXPENSE
export const updateExpense = async (req, res) => {
    try {
        const updated = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ message: "Expense updated", updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE EXPENSE
export const deleteExpense = async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: "Expense deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// SUMMARY (Analytics)
export const expenseSummary = async (req, res) => {
    try {
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

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
