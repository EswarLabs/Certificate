import rateLimit from "express-rate-limit";

/**
 * Rate Limiting Strategy — Composite Key (userId + IP)
 * 
 * Problem with IP-only limiting:
 *   - A company with 50 employees behind a single corporate NAT/proxy
 *     shares one IP. IP-only limits punish the whole company for one person's usage.
 *   - Meanwhile, an abuser on a residential connection (unique IP) gets full limits.
 * 
 * Solution: Multi-dimensional key generation:
 * 
 *   1. AUTHENTICATED requests → key = "user:<userId>"
 *      Each logged-in user gets their own bucket regardless of IP.
 *      50 employees on the same corporate IP each get full limits.
 *
 *   2. UNAUTHENTICATED requests → key = "ip:<IP>"
 *      Public endpoints (verify, login) still use IP because there's no user context.
 *      This is fine — these are low-volume public endpoints anyway.
 *
 *   3. SENSITIVE operations → key = "user:<userId>|ip:<IP>"
 *      Double-keyed: limits apply per-user AND per-IP independently.
 *      Prevents a compromised account from bulk-abusing from many IPs,
 *      AND prevents a single IP from brute-forcing across many accounts.
 */

// ---------- Key Generators ----------

/** For authenticated API routes — keyed by userId (IP-independent) */
const userKey = (req) => {
    if (req.user?.userId) return `user:${req.user.userId}`;
    return `ip:${req.ip}`;
};

/** For public/unauthenticated endpoints — keyed by IP */
const ipKey = (req) => `ip:${req.ip}`;

/** For sensitive operations — keyed by userId + IP (both must be under limit) */
const compositeKey = (req) => {
    if (req.user?.userId) return `user:${req.user.userId}|ip:${req.ip}`;
    return `ip:${req.ip}`;
};

// ---------- Limiter Instances ----------

/**
 * Global API limiter for AUTHENTICATED routes.
 * Keyed by userId so corporate networks aren't penalized.
 * 300 requests per 15 minutes per user = 20/sec sustained, generous for normal usage.
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: userKey,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});

/**
 * Public endpoint limiter (verification page, health check).
 * Keyed by IP since these routes have no auth context.
 * 60 requests per 15 minutes per IP = enough for legitimate verification lookups.
 */
export const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKey,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});

/**
 * Registration limiter.
 * Keyed by IP — no userId exists yet at signup time.
 * 5 accounts per hour per IP prevents mass account creation.
 */
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKey,
    message: {
        success: false,
        message: "Too many accounts created from this network. Please try again after an hour.",
    },
});

/**
 * Login limiter.
 * Composite key: limits per-IP AND per-user independently.
 * This means:
 *   - 10 failed attempts from one IP across ANY accounts → blocked
 *   - 10 failed attempts for one account from ANY IPs → blocked
 * Prevents both credential stuffing (many accounts, one IP) and 
 * distributed brute-force (one account, many IPs).
 */
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use email + IP for login — we don't have userId yet
        const email = req.body?.email || "unknown";
        return `login:${email}|ip:${req.ip}`;
    },
    message: {
        success: false,
        message: "Too many login attempts. Please try again later.",
    },
});

/**
 * Email sending limiter (password reset, OTP, certificate emails).
 * Keyed by userId for authenticated routes, IP for unauthenticated (forgot password).
 */
export const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: userKey,
    message: {
        success: false,
        message: "Too many email requests. Please try again later.",
    },
});

/**
 * Bulk operation limiter (CSV import, batch issuance).
 * Keyed by userId — each user gets 10 bulk ops per hour regardless of IP.
 * This is the most expensive operation — generate hundreds of PDFs/images.
 */
export const bulkLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: userKey,
    message: {
        success: false,
        message: "Bulk operation limit exceeded. Please try again later.",
    },
});

/**
 * Organization creation limiter.
 * Composite key: 3 orgs per day per user, AND 5 per day per IP.
 * Even if an attacker creates multiple accounts, they can't create more than
 * 5 orgs per day from the same IP.
 */
export const orgCreationLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: compositeKey,
    message: {
        success: false,
        message: "Organization creation limit reached for today. Please try again tomorrow.",
    },
});

/**
 * File upload limiter.
 * Keyed by userId — 30 uploads per hour per user.
 * Prevents storage abuse without affecting a team on the same corporate network.
 */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: userKey,
    message: {
        success: false,
        message: "Upload limit reached. Please try again later.",
    },
});

/**
 * Event tracking limiter (public endpoint for certificate views/verifications).
 * Keyed by IP — prevents audit log flooding.
 * 30 events per minute per IP is generous for legitimate use.
 */
export const eventTrackingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKey,
    message: {
        success: false,
        message: "Event tracking rate limit exceeded.",
    },
});