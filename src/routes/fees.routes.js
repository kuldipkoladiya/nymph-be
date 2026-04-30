import express from "express";
import {
    setYearlyFee,
    recordFeePayment,
    getStudentFeeStatus, getPendingFeesStudents,
    updatePayment, deletePayment,
    getAllFeeStructures, deleteFeeStructure,
    getAllPayments
} from "../controllers/fees.controller.js";
import {getFeesAnalytics} from "../controllers/fees.analytics.controller.js";
import validate from "../middlewares/validate.js";
import {recordPaymentSchema, setYearlyFeeSchema} from "../modules/fees/fee.validation.js";

const router = express.Router();

router.post("/structure", validate(setYearlyFeeSchema), setYearlyFee);
router.get("/all", getAllFeeStructures);
router.get("/all-payments", getAllPayments);
router.delete("/:id", deleteFeeStructure);
router.post("/pay", validate(recordPaymentSchema), recordFeePayment);
router.get("/status/:studentId", getStudentFeeStatus);
router.get("/analytics", getFeesAnalytics);
router.get("/pending", getPendingFeesStudents);
router.put("/pay/:id", updatePayment);
router.delete("/pay/:id", deletePayment);

export default router;
