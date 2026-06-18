import expressRateLimiter from "express-rate-limiter";

export const registerLimiter = new expressRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // limit each IP to 5 requests per windowMs
    message: "Too many accounts created, please try again after an hour",
});

export const loginLimiter = new expressRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10, // limit each IP to 10 requests per windowMs
    message: "Too many login attempts, please try again after an hour",
});

export const emailLimiter = new expressRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 20, // limit each IP to 20 requests per windowMs
    message: "Too many email requests, please try again after an hour",
});

export const rateLimit = new expressRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 200, // limit each IP to 200 requests per windowMs
    message: "Too many requests, please try again after an hour",
});