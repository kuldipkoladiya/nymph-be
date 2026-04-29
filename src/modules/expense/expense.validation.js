import Joi from "joi";

export const addExpenseSchema = Joi.object({
    title: Joi.string().required(),
    amount: Joi.number().required(),
    category: Joi.string().required(),
    date: Joi.date().required(),
    description: Joi.string().allow(""),
});
