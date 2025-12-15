import express from "express";
import {getDashboardStats, getStandardWiseFeeStats} from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/", getDashboardStats);
router.get("/fees/standard-wise", getStandardWiseFeeStats);
export default router;
