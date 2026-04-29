import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import connectDB from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MUST RUN AFTER .env loaded
connectDB();

app.use("/api", routes);

// Global Error Handler should be last
app.use(errorHandler);

export default app;
