import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["superadmin", "staff"], default: "staff" },
        permissions: {
            dashboard: { type: Boolean, default: false },
            students: { type: Boolean, default: false },
            results: { type: Boolean, default: false },
            fees: { type: Boolean, default: false },
            attendance: { type: Boolean, default: false },
            expenses: { type: Boolean, default: false },
        },
    },
    { timestamps: true }
);

// Encrypt password before saving
adminSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
adminSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
};

export default mongoose.model("Admin", adminSchema);
