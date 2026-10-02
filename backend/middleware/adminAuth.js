const jwt = require("jsonwebtoken");

/**
 * adminAuth middleware
 * ─────────────────────────────────────────────
 * Validates the Bearer JWT sent by the admin portal.
 * Checks that the token carries role === "admin" so that
 * a client/tenant token can never be used to access admin routes,
 * and an admin token can never satisfy the clientAuth middleware
 * (which looks for payload.tenantId instead).
 *
 * On success, attaches req.adminUsername (string).
 */
function adminAuth(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Admin authentication required. Please log in.",
        });
    }

    const token = authHeader.slice(7); // strip "Bearer "

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // Hard role check — client tokens have tenantId but no role: "admin"
        if (payload.role !== "admin") {
            return res.status(401).json({
                success: false,
                message: "Invalid or insufficient token.",
            });
        }

        req.adminUsername = payload.username;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Your admin session has expired. Please log in again.",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid or malformed token.",
        });
    }
}

module.exports = adminAuth;
