import express from "express";
import {
    createResult,
    updateResult,
    getStudentResults,
    deleteResult,
} from "../controllers/result.controller.js";
import {generateResultPDF, getResultById} from "../controllers/pdf.controller.js";



const router = express.Router();

router.post("/", createResult);
router.put("/:id", updateResult);
router.get("/student/:id", getStudentResults);
router.delete("/:id", deleteResult);
router.get("/pdf/:studentId/:examId", generateResultPDF);
router.get("/id/:resultId",  getResultById);
export default router;
