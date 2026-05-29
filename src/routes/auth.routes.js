import express from "express";
import {
    loginAdmin,
    registerAdmin,
    getAdminProfile,
    getStaffAccounts,
    createStaffAccount,
    updateStaffPermissions,
    deleteStaffAccount,
    setupSuperAdmin,
} from "../controllers/admin.controller.js";
import {loginSchema, registerSchema} from "../modules/admin/admin.validation.js";
import validate from "../middlewares/validate.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// ── PUBLIC ──────────────────────────────────────────────────────────────────
// One-time superadmin setup (locked after first admin is created)
router.post("/setup", setupSuperAdmin);
router.post("/register", validate(registerSchema), registerAdmin);
router.post("/login", validate(loginSchema), loginAdmin);

// ── PROTECTED ───────────────────────────────────────────────────────────────
router.get("/profile", auth, getAdminProfile);

// ── STAFF MANAGEMENT (Superadmin only) ──────────────────────────────────────
router.get("/staff",        auth, getStaffAccounts);
router.post("/staff",       auth, createStaffAccount);
router.put("/staff/:id",    auth, updateStaffPermissions);
router.delete("/staff/:id", auth, deleteStaffAccount);

export default router;
