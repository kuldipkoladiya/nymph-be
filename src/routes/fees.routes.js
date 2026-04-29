import express from "express";
import {
    setYearlyFee,
    recordFeePayment,
    getStudentFeeStatus, getPendingFeesStudents
} from "../controllers/fees.controller.js";
import {getFeesAnalytics} from "../controllers/fees.analytics.controller.js";
import validate from "../middlewares/validate.js";
import {recordPaymentSchema, setYearlyFeeSchema} from "../modules/fees/fee.validation.js";

const router = express.Router();

router.post("/structure", validate(setYearlyFeeSchema), setYearlyFee);       // Set yearly fee
router.post("/pay", validate(recordPaymentSchema), recordFeePayment);         // Record payment
router.get("/status/:studentId", getStudentFeeStatus);
router.get("/analytics", getFeesAnalytics);
router.get("/pending", getPendingFeesStudents);

export default router;
