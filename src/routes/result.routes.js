import express from "express";
import {
    createResult,
    updateResult,
    getStudentResults,
    deleteResult,
} from "../controllers/result.controller.js";
import {generateResultPDF, getResultById, sendResultWhatsAppController, getWhatsAppStatusController} from "../controllers/pdf.controller.js";
import validate from "../middlewares/validate.js";
import {createResultSchema} from "../modules/result/result.validation.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.use(authorize("results"));

router.post("/", validate(createResultSchema), createResult);
router.put("/:id", updateResult);
router.get("/student/:id", getStudentResults);
router.delete("/:id", deleteResult);
router.get("/pdf/:studentId/:examId", generateResultPDF);
router.post("/send-whatsapp/:studentId/:examId", sendResultWhatsAppController);
router.get("/id/:resultId",  getResultById);
router.get("/whatsapp-status", getWhatsAppStatusController);
export default router;
