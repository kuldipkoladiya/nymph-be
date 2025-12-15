import express from "express";
import {createStudentSchema, updateStudentSchema} from "../modules/student/student.validation.js";
import {
    createStudent,
    deleteStudent,
    getStudent,
    getStudents, getStudentsByStandard,
    updateStudent
} from "../controllers/student.controller.js";
import validate from "../middlewares/validate.js";
import upload from "../middlewares/upload.js";



const router = express.Router();

router.post(
    "/",
    upload.single("image"),
    validate(createStudentSchema),
    createStudent
);

router.get("/", getStudents);
router.get("/:id", getStudent);

router.put(
    "/:id",
    upload.single("image"),
    validate(updateStudentSchema),
    updateStudent
);

router.delete("/:id", deleteStudent);
router.get("/by-standard/:standard", getStudentsByStandard);

export default router;
