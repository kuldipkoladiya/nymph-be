import express from "express";
import authRoutes from "./auth.routes.js";
import studentRoutes from "./student.routes.js";
import resultRoutes from "./result.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import feeRoutes from "../routes/fees.routes.js";
import expenseRoutes from "../routes/expense.route.js";
import weeklyTestRoutes from "../routes/weeklyTest.route.js";
import auth from "../middlewares/auth.js";


const router = express.Router();

router.use("/auth", authRoutes);
router.use("/students", auth,studentRoutes);
router.use("/results", auth,resultRoutes);
router.use("/attendance",auth, attendanceRoutes);
router.use("/dashboard",auth, dashboardRoutes);
router.use("/fees", auth,feeRoutes);
router.use("/expense", auth,expenseRoutes);
router.use("/weekly-test", auth,weeklyTestRoutes);

export default  router;
