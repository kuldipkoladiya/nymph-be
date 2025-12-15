import Joi from "joi";

export const createStudentSchema = Joi.object({
    name: Joi.string().required(),
    rollNumber: Joi.string().required(),
    standard: Joi.string().required(),
    section: Joi.string().optional(),
    fatherName: Joi.string().optional(),
    motherName: Joi.string().optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    dob: Joi.string().optional(),
});

export const updateStudentSchema = Joi.object({
    name: Joi.string().optional(),
    standard: Joi.string().optional(),
    section: Joi.string().optional(),
    fatherName: Joi.string().optional(),
    motherName: Joi.string().optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    dob: Joi.string().optional(),
});
