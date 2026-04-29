import Joi from "joi";

export const createResultSchema = Joi.object({
    studentId: Joi.string().required(),
    examName: Joi.string().required(),
    standard: Joi.string().required(),
    subjects: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            marksObtained: Joi.number().required(),
            totalMarks: Joi.number().required(),
        })
    ).required(),
    examDate: Joi.date().required(),
});
