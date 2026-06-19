import rateLimit from "express-rate-limit";

// Global API limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});

// Registration limiter
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many accounts created. Please try again after an hour.",
    },
});

// Login limiter
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Please try again later.",
    },
});

// Forgot password / OTP limiter
export const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many email requests. Please try again later.",
    },
});

// Bulk certificate issuance limiter
export const bulkLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Bulk issuance limit exceeded. Please try again later.",
    },
});