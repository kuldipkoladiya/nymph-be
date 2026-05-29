import Admin from "../models/Admin.model.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

// Generate Token
const generateToken = (admin) => {
    return jwt.sign(
        { id: admin._id, email: admin.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
};

// ─── VERIFY SETUP KEY ─────────────────────────────────────────────────────────
// POST /api/auth/verify-setup-key
// Called in Step 1 of the /setup page. Validates the secret key and checks
// that setup has not been completed yet. Does NOT create any account.
export const verifySetupKey = asyncHandler(async (req, res) => {
    const { setupKey } = req.body;

    if (!setupKey || setupKey !== process.env.SETUP_SECRET_KEY) {
        res.status(403);
        throw new Error("Invalid setup key. Please try again.");
    }

    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
        res.status(403);
        throw new Error("Setup already completed. A superadmin account already exists.");
    }

    res.json({ valid: true, message: "Key verified. Proceed to create your account." });
});

// ─── ONE-TIME SUPERADMIN SETUP ────────────────────────────────────────────────
// POST /api/auth/setup
// Only works when:
//   1. The provided setupKey matches SETUP_SECRET_KEY in .env
//   2. Zero admin accounts exist in the database (auto-locks after first use)
export const setupSuperAdmin = asyncHandler(async (req, res) => {
    const { name, email, password, setupKey } = req.body;

    // 1. Validate secret key
    if (!setupKey || setupKey !== process.env.SETUP_SECRET_KEY) {
        res.status(403);
        throw new Error("Invalid setup key");
    }

    // 2. Lock after first superadmin is created
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
        res.status(403);
        throw new Error("Setup already completed. A superadmin account already exists.");
    }

    // 3. Validate fields
    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Name, email, and password are required");
    }

    if (password.length < 8) {
        res.status(400);
        throw new Error("Password must be at least 8 characters");
    }

    // 4. Create superadmin with all permissions
    const superadmin = await Admin.create({
        name,
        email,
        password,
        role: "superadmin",
        permissions: {
            dashboard: true,
            students: true,
            results: true,
            fees: true,
            attendance: true,
            expenses: true,
        },
    });

    const adminData = superadmin.toObject();
    delete adminData.password;

    return res.status(201).json({
        message: "Superadmin account created successfully! You can now log in.",
        admin: adminData,
    });
});


// ─── REGISTER (Legacy — only used as fallback) ───────────────────────────────
// REGISTER
export const registerAdmin = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const exist = await Admin.findOne({ email });
    if (exist) {
        res.status(400);
        throw new Error("Admin already exists");
    }

    // Bootstrap logic:
    // If no admin accounts exist in the DB, make this first one a superadmin.
    // If admins already exist, require the request to be authenticated by a superadmin.
    const adminCount = await Admin.countDocuments();
    let role = "staff";
    let permissions = {
        dashboard: false,
        students: false,
        results: false,
        fees: false,
        attendance: false,
        expenses: false,
    };

    if (adminCount === 0) {
        role = "superadmin";
        permissions = {
            dashboard: true,
            students: true,
            results: true,
            fees: true,
            attendance: true,
            expenses: true,
        };
    } else {
        if (!req.admin || !req.admin.id) {
            res.status(401);
            throw new Error("Authentication required to create additional accounts");
        }
        const currentAdmin = await Admin.findById(req.admin.id);
        if (!currentAdmin || currentAdmin.role !== "superadmin") {
            res.status(403);
            throw new Error("Only superadmins can create new accounts");
        }
    }

    const admin = await Admin.create({ 
        name, 
        email, 
        password,
        role,
        permissions
    });

    return res.status(201).json({
        message: adminCount === 0 ? "Superadmin registered successfully" : "Account registered successfully",
        token: generateToken(admin),
    });
});

// LOGIN
export const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
        res.status(404);
        throw new Error("Admin not found");
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
        res.status(401);
        throw new Error("Invalid password");
    }

    const token = generateToken(admin);

    // Remove password before sending
    const adminData = admin.toObject();
    delete adminData.password;

    return res.json({
        message: "Login successful",
        token,
        admin: adminData,
    });
});

export const getAdminProfile = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
        res.status(404);
        throw new Error("Admin not found");
    }
    const adminData = admin.toObject();
    delete adminData.password;
    res.json(adminData);
});

// GET ALL STAFF (Superadmin only)
export const getStaffAccounts = asyncHandler(async (req, res) => {
    const currentAdmin = await Admin.findById(req.admin.id);
    if (!currentAdmin || currentAdmin.role !== "superadmin") {
        res.status(403);
        throw new Error("Only superadmin can access staff accounts list");
    }

    const staffList = await Admin.find({ role: "staff" }).sort({ createdAt: -1 });
    res.json(staffList);
});

// CREATE STAFF ACCOUNT (Superadmin only)
export const createStaffAccount = asyncHandler(async (req, res) => {
    const currentAdmin = await Admin.findById(req.admin.id);
    if (!currentAdmin || currentAdmin.role !== "superadmin") {
        res.status(403);
        throw new Error("Only superadmin can create staff accounts");
    }

    const { name, email, password, permissions } = req.body;

    const exist = await Admin.findOne({ email });
    if (exist) {
        res.status(400);
        throw new Error("Email already registered");
    }

    const staff = await Admin.create({
        name,
        email,
        password,
        role: "staff",
        permissions: {
            dashboard: permissions?.dashboard || false,
            students: permissions?.students || false,
            results: permissions?.results || false,
            fees: permissions?.fees || false,
            attendance: permissions?.attendance || false,
            expenses: permissions?.expenses || false,
        }
    });

    const staffData = staff.toObject();
    delete staffData.password;

    res.status(201).json({
        message: "Staff account created successfully",
        staff: staffData
    });
});

// UPDATE STAFF ACCOUNT (Superadmin only)
export const updateStaffPermissions = asyncHandler(async (req, res) => {
    const currentAdmin = await Admin.findById(req.admin.id);
    if (!currentAdmin || currentAdmin.role !== "superadmin") {
        res.status(403);
        throw new Error("Only superadmin can modify staff accounts");
    }

    const { name, email, password, permissions } = req.body;
    const staff = await Admin.findById(req.params.id);

    if (!staff) {
        res.status(404);
        throw new Error("Staff account not found");
    }

    if (name) staff.name = name;
    if (email) {
        const exist = await Admin.findOne({ email, _id: { $ne: staff._id } });
        if (exist) {
            res.status(400);
            throw new Error("Email already in use");
        }
        staff.email = email;
    }
    if (password && password.trim() !== "") {
        staff.password = password;
    }

    if (permissions) {
        staff.permissions = {
            dashboard: permissions.dashboard ?? staff.permissions.dashboard,
            students: permissions.students ?? staff.permissions.students,
            results: permissions.results ?? staff.permissions.results,
            fees: permissions.fees ?? staff.permissions.fees,
            attendance: permissions.attendance ?? staff.permissions.attendance,
            expenses: permissions.expenses ?? staff.permissions.expenses,
        };
    }

    await staff.save();

    const staffData = staff.toObject();
    delete staffData.password;

    res.json({
        message: "Staff account updated successfully",
        staff: staffData
    });
});

// DELETE STAFF ACCOUNT (Superadmin only)
export const deleteStaffAccount = asyncHandler(async (req, res) => {
    const currentAdmin = await Admin.findById(req.admin.id);
    if (!currentAdmin || currentAdmin.role !== "superadmin") {
        res.status(403);
        throw new Error("Only superadmin can delete staff accounts");
    }

    const staff = await Admin.findById(req.params.id);
    if (!staff) {
        res.status(404);
        throw new Error("Staff account not found");
    }

    if (staff._id.toString() === currentAdmin._id.toString()) {
        res.status(400);
        throw new Error("You cannot delete your own superadmin account");
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.json({ message: "Staff account deleted successfully" });
});

