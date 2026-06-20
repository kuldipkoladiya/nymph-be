import express from "express";
import {createStudentSchema, updateStudentSchema} from "../modules/student/student.validation.js";
import {
    createStudent,
    deleteStudent,
    getStudent,
    getStudents, getStudentsByStandard,
    updateStudent,
    bulkPromoteStudents
} from "../controllers/student.controller.js";
import validate from "../middlewares/validate.js";
import upload from "../middlewares/upload.js";
import { authorize, authorizeAny } from "../middlewares/authorize.js";

const router = express.Router();

router.post(
    "/",
    authorize("students"),
    upload.single("image"),
    validate(createStudentSchema),
    createStudent
);

router.get("/", authorizeAny(["students", "attendance", "results", "fees"]), getStudents);
router.get("/:id", authorizeAny(["students", "attendance", "results", "fees"]), getStudent);

router.put(
    "/:id",
    authorize("students"),
    upload.single("image"),
    validate(updateStudentSchema),
    updateStudent
);

router.delete("/:id", authorize("students"), deleteStudent);
router.get("/by-standard/:standard", authorizeAny(["students", "attendance", "results", "fees"]), getStudentsByStandard);
router.post("/bulk-promote", authorize("students"), bulkPromoteStudents);

export default router;
