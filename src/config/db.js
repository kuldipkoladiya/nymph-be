import mongoose from "mongoose";
import Payment from "../models/payment.model.js";
import Attendance from "../models/attendance.model.js";
import Student from "../models/student.model.js";

const connectDB = async () => {
    const uri = process.env.MONGO_URL;

    console.log("🔎 Checking MONGO_URL =", uri);

    if (!uri) {
        console.error("❌ ERROR: MONGO_URL is missing in .env");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log("🔥 MongoDB Connected Successfully!");

        // Run migration for Standard Promotion fields
        try {
            // Migration 1: Populate missing standard in Payment records
            const paymentsWithoutStd = await Payment.find({ standard: { $exists: false } });
            if (paymentsWithoutStd.length > 0) {
                console.log(`🧹 Found ${paymentsWithoutStd.length} Payment records without 'standard' field. Migrating...`);
                let count = 0;
                for (const payment of paymentsWithoutStd) {
                    const student = await Student.findById(payment.studentId);
                    if (student) {
                        payment.standard = student.standard;
                        await payment.save();
                        count++;
                    }
                }
                console.log(`✅ Migrated ${count} Payment records with their current student's standard.`);
            }

            // Migration 2: Populate missing standard/section in Attendance records
            const attendanceWithoutFields = await Attendance.find({ 
                $or: [
                    { standard: { $exists: false } },
                    { section: { $exists: false } }
                ]
            });
            if (attendanceWithoutFields.length > 0) {
                console.log(`🧹 Found ${attendanceWithoutFields.length} Attendance records without standard or section. Migrating...`);
                let count = 0;
                for (const attendance of attendanceWithoutFields) {
                    const student = await Student.findById(attendance.studentId);
                    if (student) {
                        attendance.standard = attendance.standard || student.standard;
                        attendance.section = attendance.section || student.section;
                        await attendance.save();
                        count++;
                    }
                }
                console.log(`✅ Migrated ${count} Attendance records.`);
            }
        } catch (migrationErr) {
            console.error("⚠️ Migration check error:", migrationErr.message);
        }

        // Drop the old global unique index on rollNumber if it exists
        try {
            const db = mongoose.connection.db;
            const collections = await db.listCollections({ name: "students" }).toArray();
            if (collections.length > 0) {
                const indexes = await db.collection("students").indexes();
                const rollNumIndex = indexes.find(idx => idx.name === "rollNumber_1");
                if (rollNumIndex) {
                    console.log("🧹 Found old unique index rollNumber_1. Dropping it...");
                    await db.collection("students").dropIndex("rollNumber_1");
                    console.log("✅ Successfully dropped old unique index rollNumber_1.");
                }
                const compoundIndex = indexes.find(idx => idx.name === "rollNumber_1_standard_1");
                if (compoundIndex) {
                    console.log("🧹 Found old unique index rollNumber_1_standard_1. Dropping it...");
                    await db.collection("students").dropIndex("rollNumber_1_standard_1");
                    console.log("✅ Successfully dropped old unique index rollNumber_1_standard_1.");
                }
            }
        } catch (err) {
            console.warn("⚠️ Failed to drop old student index:", err.message);
        }
    } catch (error) {
        console.error("❌ DB Connection Error:", error.message);
        process.exit(1);
    }
};

export default connectDB;
