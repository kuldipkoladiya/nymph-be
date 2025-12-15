import express from "express";
import {
    addExpense,
    getExpenses,
    deleteExpense,
    updateExpense,
    expenseSummary,
} from "../controllers/expense.controller.js";

const router = express.Router();

router.post("/add", addExpense);
router.get("/all", getExpenses);
router.put("/update/:id", updateExpense);
router.delete("/delete/:id", deleteExpense);

// Analytics
router.get("/summary", expenseSummary);

export default router;
