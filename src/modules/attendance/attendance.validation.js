import Joi from "joi";

export const markAttendanceSchema = Joi.object({
    studentId: Joi.string().required(),
    date: Joi.date().required(),
    status: Joi.string().valid("Present", "Absent", "Leave").required(),
    remark: Joi.string().allow(""),
});
