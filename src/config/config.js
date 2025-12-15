import dotenv from "dotenv";
dotenv.config();

const config = {
    mongoose: {
        url: process.env.MONGO_URL,       // MUST USE YOUR ENV
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET || "secret",
};

export default config;
