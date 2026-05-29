import express from "express";
import {getDashboardStats, getStandardWiseFeeStats} from "../controllers/dashboard.controller.js";
import { authorize, authorizeAny } from "../middlewares/authorize.js";

const router = express.Router();

router.get("/", authorizeAny(["dashboard", "students", "results", "attendance", "fees", "expenses"]), getDashboardStats);
router.get("/fees/standard-wise", authorize("fees"), getStandardWiseFeeStats);
export default router;
