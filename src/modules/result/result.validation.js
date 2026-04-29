import Joi from "joi";

export const createResultSchema = Joi.object({
    studentId: Joi.string().required(),
    examName: Joi.string().required(),
    subjects: Joi.array().items(
        Joi.object({
            subjectName: Joi.string().required(),
            marksObtained: Joi.number().required(),
            totalMarks: Joi.number().required(),
        })
    ).required(),
    date: Joi.date().required(),
});
