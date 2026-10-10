const express = require("express");
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");
const adminAuth = require("../middleware/adminAuth");
const {
    checkLoginAttempt,
    recordFailedAttempt,
    recordSuccessfulLogin,
} = require("../middleware/loginLimiter");

const router = express.Router();

/* ─────────────────────────────────────────────
   POST /api/admin/login
   Validates username + password against the values
   stored in .env (ADMIN_USERNAME, ADMIN_PASSWORD_HASH).
   Never stores or transmits the plaintext password.
   Returns a signed JWT with role: "admin".
─────────────────────────────────────────────── */
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required.",
            });
        }

        // Check rate limit / lockout status
        const lockCheck = checkLoginAttempt(req, username);
        if (lockCheck.locked) {
            return res.status(429).json({
                success: false,
                message: lockCheck.message,
                retryAfter: lockCheck.remainingSeconds,
            });
        }

        const adminUsername = process.env.ADMIN_USERNAME;
        const adminHash     = process.env.ADMIN_PASSWORD_HASH;

        if (!adminUsername || !adminHash) {
            console.error("Admin credentials are not configured in .env");
            return res.status(500).json({
                success: false,
                message: "Admin login is not configured. Contact the system administrator.",
            });
        }

        // Deliberately vague on both username mismatch and wrong password
        // to avoid revealing whether the username exists
        const cleanUsername = username.trim().replace(/^@/, "");
        if (cleanUsername !== adminUsername) {
            const failResult = recordFailedAttempt(req, username);
            return res.status(failResult.locked ? 429 : 401).json({
                success: false,
                message: failResult.message,
                retryAfter: failResult.remainingSeconds,
                remainingAttempts: failResult.remainingAttempts,
            });
        }

        const passwordMatch = await bcrypt.compare(password, adminHash);

        if (!passwordMatch) {
            const failResult = recordFailedAttempt(req, username);
            return res.status(failResult.locked ? 429 : 401).json({
                success: false,
                message: failResult.message,
                retryAfter: failResult.remainingSeconds,
                remainingAttempts: failResult.remainingAttempts,
            });
        }

        // Reset failed attempt counter on successful login
        recordSuccessfulLogin(req, username);

        // Sign a JWT — role: "admin" is the discriminator that separates
        // this token from any client/tenant JWT (which has tenantId, no role)
        const token = jwt.sign(
            {
                role:     "admin",
                username: adminUsername,
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({
            success: true,
            message: "Login successful.",
            data: {
                token,
                admin: { username: adminUsername },
            },
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({
            success: false,
            message: "Login failed due to a server error. Please try again.",
        });
    }
});

/* ─────────────────────────────────────────────
   GET /api/admin/me
   Returns the authenticated admin's identity.
   Protected — requires valid admin JWT.
─────────────────────────────────────────────── */
router.get("/me", adminAuth, (req, res) => {
    res.json({
        success: true,
        data: { username: req.adminUsername },
    });
});

module.exports = router;
