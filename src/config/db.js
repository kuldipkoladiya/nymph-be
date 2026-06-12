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
