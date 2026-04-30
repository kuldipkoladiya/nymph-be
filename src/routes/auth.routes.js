import express from "express";
import {loginAdmin, registerAdmin, getAdminProfile} from "../controllers/admin.controller.js";
import {loginSchema, registerSchema} from "../modules/admin/admin.validation.js";
import validate from "../middlewares/validate.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerAdmin);
router.post("/login", validate(loginSchema), loginAdmin);
router.get("/profile", auth, getAdminProfile);

export default router;
