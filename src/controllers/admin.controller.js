import Admin from "../models/Admin.model.js";
import jwt from "jsonwebtoken";

// Generate Token
const generateToken = (admin) => {
    return jwt.sign(
        { id: admin._id, email: admin.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
};

// REGISTER
export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const exist = await Admin.findOne({ email });
        if (exist) return res.status(400).json({ message: "Admin already exists" });

        const admin = await Admin.create({ name, email, password });

        return res.status(201).json({
            message: "Admin registered",
            token: generateToken(admin),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// LOGIN
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email }).select("+password");
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
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

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

