import express from "express";
import {
    markAttendance,
    updateAttendance,
    getAttendanceByDate,
    getStudentAttendance,
    getMonthlySummary, getAttendanceByDateAndStandard, getAttendanceByStandard
} from "../controllers/attendance.controller.js";

const router = express.Router();

router.post("/", markAttendance);
router.put("/:id", updateAttendance);
router.get("/date/:date", getAttendanceByDate);
router.get("/student/:studentId", getStudentAttendance);
router.get("/summary/monthly", getMonthlySummary);
router.get("/filter", getAttendanceByDateAndStandard);
router.get("/standard/:standard", getAttendanceByStandard);
getAttendanceByStandard
export default router;
