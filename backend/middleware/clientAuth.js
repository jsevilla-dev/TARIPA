const jwt = require("jsonwebtoken");

/**
 * clientAuth middleware
 * ─────────────────────────────────────────────
 * Validates the Bearer JWT sent by the client portal.
 * On success, attaches req.clientTenantId (number) so that
 * every downstream route handler can safely scope its SQL
 * queries to the authenticated tenant — no client-supplied
 * tenant_id parameter is ever trusted.
 */
function clientAuth(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please log in.",
        });
    }

    const token = authHeader.slice(7); // strip "Bearer "

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        if (!payload.tenantId || typeof payload.tenantId !== "number") {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload.",
            });
        }

        req.clientTenantId = payload.tenantId;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Your session has expired. Please log in again.",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid or malformed token.",
        });
    }
}

module.exports = clientAuth;
