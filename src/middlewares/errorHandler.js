export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // res.status() sets res.statusCode — use that if already set (and not default 200)
    // otherwise fall back to err.statusCode, then 500
    const statusCode =
        (res.statusCode && res.statusCode !== 200)
            ? res.statusCode
            : err.statusCode || 500;

    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message,                                               // ← frontend reads .message
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};
