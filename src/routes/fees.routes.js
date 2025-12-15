import express from "express";
import {
    setYearlyFee,
    recordFeePayment,
    getStudentFeeStatus, getPendingFeesStudents
} from "../controllers/fees.controller.js";
import {getFeesAnalytics} from "../controllers/fees.analytics.controller.js";

const router = express.Router();

router.post("/structure", setYearlyFee);       // Set yearly fee
router.post("/pay", recordFeePayment);         // Record payment
router.get("/status/:studentId", getStudentFeeStatus);
router.get("/analytics", getFeesAnalytics);
router.get("/pending", getPendingFeesStudents);

export default router;
