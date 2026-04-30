import Joi from "joi";

export const setYearlyFeeSchema = Joi.object({
    standard: Joi.string().required(),
    yearlyFee: Joi.number().required(),
    otherFees: Joi.array().items(
        Joi.object({
            title: Joi.string().required(),
            amount: Joi.number().required(),
        })
    ),
});

export const recordPaymentSchema = Joi.object({
    studentId: Joi.string().required(),
    amount: Joi.number().required(),
    paymentMode: Joi.string().valid("Cash", "Online", "UPI", "Cheque", "Bank Transfer"),
    note: Joi.string().allow(""),
});
