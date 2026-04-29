import Joi from "joi";

export const createStudentSchema = Joi.object({
    name: Joi.string().required(),
    rollNumber: Joi.string().required(),
    standard: Joi.string().required(),
    section: Joi.string().allow(""),
    fatherName: Joi.string().allow(""),
    motherName: Joi.string().allow(""),
    phone: Joi.string().allow(""),
    address: Joi.string().allow(""),
    dob: Joi.string().allow(""),
});

export const updateStudentSchema = Joi.object({
    name: Joi.string(),
    rollNumber: Joi.string(),
    standard: Joi.string(),
    section: Joi.string().allow(""),
    fatherName: Joi.string().allow(""),
    motherName: Joi.string().allow(""),
    phone: Joi.string().allow(""),
    address: Joi.string().allow(""),
    dob: Joi.string().allow(""),
});
