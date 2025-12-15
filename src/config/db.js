import mongoose from "mongoose";

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
    } catch (error) {
        console.error("❌ DB Connection Error:", error.message);
        process.exit(1);
    }
};

export default connectDB;
