import Joi from "joi";

export const createStudentSchema = Joi.object({
    name: Joi.string().required(),
    rollNumber: Joi.string().required(),
    standard: Joi.string().required(),
    section: Joi.string().optional().allow(""),
    fatherName: Joi.string().optional().allow(""),
    motherName: Joi.string().optional().allow(""),
    phone: Joi.string().pattern(/^[0-9]{10}$/).messages({ "string.pattern.base": "Phone number must be exactly 10 digits" }).optional().allow(""),
    secondPhone: Joi.string().pattern(/^[0-9]{10}$/).messages({ "string.pattern.base": "Second phone number must be exactly 10 digits" }).optional().allow(""),
    address: Joi.string().optional().allow(""),
    dob: Joi.string().optional().allow(""),
});

export const updateStudentSchema = Joi.object({
    name: Joi.string().optional(),
    rollNumber: Joi.string().optional(),
    standard: Joi.string().optional(),
    section: Joi.string().optional().allow(""),
    fatherName: Joi.string().optional().allow(""),
    motherName: Joi.string().optional().allow(""),
    phone: Joi.string().pattern(/^[0-9]{10}$/).messages({ "string.pattern.base": "Phone number must be exactly 10 digits" }).optional().allow(""),
    secondPhone: Joi.string().pattern(/^[0-9]{10}$/).messages({ "string.pattern.base": "Second phone number must be exactly 10 digits" }).optional().allow(""),
    address: Joi.string().optional().allow(""),
    dob: Joi.string().optional().allow(""),
}).unknown();
