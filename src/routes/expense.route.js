import express from "express";
import {
    addExpense,
    getExpenses,
    deleteExpense,
    updateExpense,
    expenseSummary,
} from "../controllers/expense.controller.js";
import validate from "../middlewares/validate.js";
import {addExpenseSchema} from "../modules/expense/expense.validation.js";

const router = express.Router();

router.post("/add", validate(addExpenseSchema), addExpense);
router.get("/all", getExpenses);
router.put("/update/:id", validate(addExpenseSchema), updateExpense);
router.delete("/delete/:id", deleteExpense);

// Analytics
router.get("/summary", expenseSummary);

export default router;
