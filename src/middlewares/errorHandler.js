export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // res.status() sets res.statusCode — use that if already set (and not default 200)
    // otherwise fall back to err.statusCode, then 500
    let statusCode =
        (res.statusCode && res.statusCode !== 200)
            ? res.statusCode
            : err.statusCode || 500;

    let message = err.message || "Internal Server Error";

    // Handle MongoDB duplicate key error (code 11000)
    if (err.code === 11000 || (err.name === "MongoServerError" && err.code === 11000)) {
        statusCode = 400;
        if (err.keyValue && err.keyValue.rollNumber) {
            message = `A student with roll number "${err.keyValue.rollNumber}" already exists in Class ${err.keyValue.standard || ""}${err.keyValue.section ? ` (${err.keyValue.section})` : ""}.`;
        } else {
            const keys = err.keyValue ? Object.entries(err.keyValue).map(([k, v]) => `${k}: ${v}`).join(", ") : "";
            message = `Duplicate entry error: ${keys || "A record with this information already exists."}`;
        }
    }

    res.status(statusCode).json({
        success: false,
        message,                                               // ← frontend reads .message
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};
