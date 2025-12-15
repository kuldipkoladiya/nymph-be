import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import connectDB from "./config/db.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MUST RUN AFTER .env loaded
connectDB();

app.use("/api", routes);
export default app;
