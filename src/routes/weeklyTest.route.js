import express from "express";
import { addWeeklyTest } from "../controllers/weeklyTest.controller.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.use(authorize("results"));

router.post("/add", addWeeklyTest);

export default router;
