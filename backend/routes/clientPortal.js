const express = require("express");
const db = require("../config/db");
// clientAuth middleware is applied in server.js for this entire router

const router = express.Router();

/* ─────────────────────────────────────────────
   GET /api/client/dashboard
   Returns a summary for the authenticated tenant only.
─────────────────────────────────────────────── */
router.get("/dashboard", async (req, res) => {
    const tenantId = req.clientTenantId;

    try {
        // Tenant profile + room
        const [tenantRows] = await db.query(
            `
            SELECT
                t.id,
                t.full_name,
                t.contact_number,
                t.move_in_date,
                t.status,
                r.room_number
            FROM tenants t
            LEFT JOIN rooms r ON r.id = t.room_id
            WHERE t.id = ?
            LIMIT 1
            `,
            [tenantId]
        );

        if (tenantRows.length === 0) {
            return res.status(404).json({ success: false, message: "Tenant not found." });
        }

        // Latest billing record
        const [latestBillRows] = await db.query(
            `
            SELECT
                DATE_FORMAT(billing_month, '%Y-%m-%d') AS billing_month,
                electricity_consumption,
                electricity_charge,
                water_consumption,
                water_charge,
                total_amount,
                status
            FROM billing_records
            WHERE tenant_id = ?
            ORDER BY billing_month DESC
            LIMIT 1
            `,
            [tenantId]
        );

        // Outstanding amount (Pending + Overdue)
        const [outstandingRows] = await db.query(
            `
            SELECT
                COALESCE(SUM(total_amount), 0) AS outstanding_amount,
                COUNT(*) AS outstanding_count
            FROM billing_records
            WHERE tenant_id = ?
              AND status IN ('Pending', 'Overdue')
            `,
            [tenantId]
        );

        // Latest meter reading
        const [latestMeterRows] = await db.query(
            `
            SELECT
                DATE_FORMAT(billing_month, '%Y-%m-%d') AS billing_month,
                electricity_previous,
                electricity_current,
                (electricity_current - electricity_previous) AS electricity_consumption,
                water_previous,
                water_current,
                (water_current - water_previous) AS water_consumption
            FROM meter_readings
            WHERE tenant_id = ?
            ORDER BY billing_month DESC
            LIMIT 1
            `,
            [tenantId]
        );

        // Recent billing records (last 3)
        const [recentBillRows] = await db.query(
            `
            SELECT
                id,
                DATE_FORMAT(billing_month, '%Y-%m-%d') AS billing_month,
                electricity_charge,
                water_charge,
                total_amount,
                status
            FROM billing_records
            WHERE tenant_id = ?
            ORDER BY billing_month DESC
            LIMIT 3
            `,
            [tenantId]
        );

        res.json({
            success: true,
            data: {
                tenant: tenantRows[0],
                latest_bill: latestBillRows[0] || null,
                outstanding: {
                    amount: Number(outstandingRows[0].outstanding_amount),
                    count: Number(outstandingRows[0].outstanding_count),
                },
                latest_meter: latestMeterRows[0] || null,
                recent_bills: recentBillRows,
            },
        });
    } catch (error) {
        console.error("Client dashboard error:", error);
        res.status(500).json({ success: false, message: "Failed to load dashboard data." });
    }
});

/* ─────────────────────────────────────────────
   GET /api/client/bills
   Returns all billing records for the authenticated tenant.
─────────────────────────────────────────────── */
router.get("/bills", async (req, res) => {
    const tenantId = req.clientTenantId;

    try {
        const [rows] = await db.query(
            `
            SELECT
                id,
                DATE_FORMAT(billing_month, '%Y-%m-%d') AS billing_month,
                electricity_consumption,
                electricity_charge,
                water_consumption,
                water_charge,
                total_amount,
                status,
                created_at,
                updated_at
            FROM billing_records
            WHERE tenant_id = ?
            ORDER BY billing_month DESC
            `,
            [tenantId]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Client bills error:", error);
        res.status(500).json({ success: false, message: "Failed to load billing records." });
    }
});

/* ─────────────────────────────────────────────
   GET /api/client/meter-readings
   Returns all meter readings for the authenticated tenant.
─────────────────────────────────────────────── */
router.get("/meter-readings", async (req, res) => {
    const tenantId = req.clientTenantId;

    try {
        const [rows] = await db.query(
            `
            SELECT
                id,
                DATE_FORMAT(billing_month, '%Y-%m-%d') AS billing_month,
                electricity_previous,
                electricity_current,
                (electricity_current - electricity_previous) AS electricity_consumption,
                water_previous,
                water_current,
                (water_current - water_previous) AS water_consumption,
                recorded_at
            FROM meter_readings
            WHERE tenant_id = ?
            ORDER BY billing_month DESC
            `,
            [tenantId]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Client meter readings error:", error);
        res.status(500).json({ success: false, message: "Failed to load meter readings." });
    }
});

/* ─────────────────────────────────────────────
   GET /api/client/profile
   Returns full profile for the authenticated tenant.
─────────────────────────────────────────────── */
router.get("/profile", async (req, res) => {
    const tenantId = req.clientTenantId;

    try {
        const [rows] = await db.query(
            `
            SELECT
                t.id,
                t.full_name,
                t.contact_number,
                DATE_FORMAT(t.move_in_date, '%Y-%m-%d') AS move_in_date,
                t.status,
                r.room_number,
                ta.username,
                t.created_at
            FROM tenants t
            LEFT JOIN rooms r ON r.id = t.room_id
            INNER JOIN tenant_accounts ta ON ta.tenant_id = t.id
            WHERE t.id = ?
            LIMIT 1
            `,
            [tenantId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Profile not found." });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Client profile error:", error);
        res.status(500).json({ success: false, message: "Failed to load profile." });
    }
});

module.exports = router;
