const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const clientAuth = require("../middleware/clientAuth");

const router = express.Router();

/* ─────────────────────────────────────────────
   POST /api/client/login
   Validates username + password, returns a signed JWT.
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

        const cleanUsername = username.trim().replace(/^@/, "");

        // Look up the account and join the tenant profile in one query
        const [rows] = await db.query(
            `
            SELECT
                ta.id            AS account_id,
                ta.tenant_id,
                ta.username,
                ta.password_hash,
                t.full_name,
                t.status         AS tenant_status,
                r.room_number
            FROM tenant_accounts ta
            INNER JOIN tenants t ON t.id = ta.tenant_id
            LEFT JOIN rooms r ON r.id = t.room_id
            WHERE ta.username = ? OR ta.username = ?
            LIMIT 1
            `,
            [cleanUsername, username.trim()]
        );

        if (rows.length === 0) {
            // Deliberately vague — do not reveal whether username exists
            return res.status(401).json({
                success: false,
                message: "Invalid username or password.",
            });
        }

        const account = rows[0];

        // Reject login for inactive tenants
        if (account.tenant_status !== "Active") {
            return res.status(403).json({
                success: false,
                message: "Your account is currently inactive. Please contact the administrator.",
            });
        }

        const passwordMatch = await bcrypt.compare(password, account.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password.",
            });
        }

        // Sign a JWT — tenantId is embedded and verified server-side on every request
        const token = jwt.sign(
            {
                tenantId: Number(account.tenant_id),
                username: account.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({
            success: true,
            message: "Login successful.",
            data: {
                token,
                tenant: {
                    id: Number(account.tenant_id),
                    full_name: account.full_name,
                    username: account.username,
                    room_number: account.room_number,
                },
            },
        });
    } catch (error) {
        console.error("Client login error:", error);
        res.status(500).json({
            success: false,
            message: "Login failed due to a server error. Please try again.",
        });
    }
});

/* ─────────────────────────────────────────────
   GET /api/client/me
   Returns the authenticated tenant's basic profile.
   Protected — requires valid JWT.
─────────────────────────────────────────────── */
router.get("/me", clientAuth, async (req, res) => {
    try {
        const [rows] = await db.query(
            `
            SELECT
                t.id,
                t.full_name,
                t.contact_number,
                t.move_in_date,
                t.status,
                r.room_number,
                ta.username
            FROM tenants t
            LEFT JOIN rooms r ON r.id = t.room_id
            INNER JOIN tenant_accounts ta ON ta.tenant_id = t.id
            WHERE t.id = ?
            LIMIT 1
            `,
            [req.clientTenantId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Tenant profile not found.",
            });
        }

        res.json({
            success: true,
            data: rows[0],
        });
    } catch (error) {
        console.error("Client /me error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve profile.",
        });
    }
});

module.exports = router;
