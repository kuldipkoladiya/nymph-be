import express from "express";
import { addWeeklyTest } from "../controllers/weeklyTest.controller.js";

const router = express.Router();

router.post("/add", addWeeklyTest);

export default router;
