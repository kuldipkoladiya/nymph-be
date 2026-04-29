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

// REGISTER
export const registerAdmin = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const exist = await Admin.findOne({ email });
    if (exist) {
        res.status(400);
        throw new Error("Admin already exists");
    }

    const admin = await Admin.create({ name, email, password });

    return res.status(201).json({
        message: "Admin registered",
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

