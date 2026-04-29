import express from "express";
import {
    markAttendance,
    updateAttendance,
    getAttendanceByDate,
    getStudentAttendance,
    getMonthlySummary, getAttendanceByDateAndStandard, getAttendanceByStandard
} from "../controllers/attendance.controller.js";
import validate from "../middlewares/validate.js";
import {markAttendanceSchema} from "../modules/attendance/attendance.validation.js";

const router = express.Router();

router.post("/", validate(markAttendanceSchema), markAttendance);
router.put("/:id", updateAttendance);
router.get("/date/:date", getAttendanceByDate);
router.get("/student/:studentId", getStudentAttendance);
router.get("/summary/monthly", getMonthlySummary);
router.get("/filter", getAttendanceByDateAndStandard);
router.get("/standard/:standard", getAttendanceByStandard);
getAttendanceByStandard
export default router;
