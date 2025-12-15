import express from "express";
import {loginAdmin, registerAdmin} from "../controllers/admin.controller.js";
import {loginSchema, registerSchema} from "../modules/admin/admin.validation.js";
import validate from "../middlewares/validate.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerAdmin);
router.post("/login", validate(loginSchema), loginAdmin);

export default router;
