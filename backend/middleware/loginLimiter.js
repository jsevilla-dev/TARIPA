/* ─────────────────────────────────────────────────────────────
   LOGIN ATTEMPT LIMITER (Brute Force Protection)
   - Max failed attempts: 5
   - Warning threshold: at 3 and 4 failed attempts
   - Lockout duration: 30 seconds
   - Key: client IP + normalized username
───────────────────────────────────────────────────────────── */

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 1000; // 30 seconds

// In-memory store: Map<key, { count: number, lockUntil: number, lastAttempt: number }>
const attemptsMap = new Map();

// Periodically clean up entries older than 5 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of attemptsMap.entries()) {
        if (now - data.lastAttempt > 5 * 60 * 1000 && data.lockUntil < now) {
            attemptsMap.delete(key);
        }
    }
}, 60 * 1000);

function getClientKey(req, username) {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const cleanUser = String(username || "").trim().toLowerCase();
    return `${ip}:${cleanUser}`;
}

function checkLoginAttempt(req, username) {
    const key = getClientKey(req, username);
    const data = attemptsMap.get(key);
    const now = Date.now();

    if (data && data.lockUntil > now) {
        const remainingSeconds = Math.ceil((data.lockUntil - now) / 1000);
        return {
            locked: true,
            remainingSeconds,
            message: `Too many failed attempts. Please wait ${remainingSeconds}s before trying again.`,
        };
    }

    return { locked: false };
}

function recordFailedAttempt(req, username) {
    const key = getClientKey(req, username);
    const now = Date.now();
    const data = attemptsMap.get(key) || { count: 0, lockUntil: 0, lastAttempt: now };

    // If previous lockout has expired, reset count
    if (data.lockUntil && data.lockUntil <= now) {
        data.count = 0;
        data.lockUntil = 0;
    }

    data.count += 1;
    data.lastAttempt = now;

    if (data.count >= MAX_ATTEMPTS) {
        data.lockUntil = now + LOCKOUT_MS;
        attemptsMap.set(key, data);
        const remainingSeconds = Math.ceil(LOCKOUT_MS / 1000);
        return {
            locked: true,
            remainingSeconds,
            remainingAttempts: 0,
            message: `Too many failed attempts. Login temporarily locked for ${remainingSeconds}s.`,
        };
    }

    attemptsMap.set(key, data);
    const remainingAttempts = MAX_ATTEMPTS - data.count;

    let message = "Invalid username or password.";
    if (remainingAttempts <= 2) {
        message = `Invalid username or password. ${remainingAttempts} attempt${remainingAttempts > 1 ? "s" : ""} remaining.`;
    }

    return {
        locked: false,
        remainingAttempts,
        message,
    };
}

function recordSuccessfulLogin(req, username) {
    const key = getClientKey(req, username);
    attemptsMap.delete(key);
}

module.exports = {
    checkLoginAttempt,
    recordFailedAttempt,
    recordSuccessfulLogin,
};
