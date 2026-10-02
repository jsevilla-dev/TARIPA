const express = require("express");
const db = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [tenants] = await db.query(`
      SELECT
        t.id,
        t.full_name,
        t.contact_number,
        t.room_id,
        r.room_number,
        t.move_in_date,
        t.status,
        t.created_at
      FROM tenants t
      LEFT JOIN rooms r ON r.id = t.room_id
      ORDER BY t.full_name;
    `);

        res.json({
            success: true,
            data: tenants,
        });
    } catch (error) {
        console.error("Failed to fetch tenants:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch tenants",
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const {
            full_name,
            contact_number,
            room_id,
            move_in_date,
        } = req.body;

        if (!full_name || !move_in_date) {
            return res.status(400).json({
                success: false,
                message: "Full name and move-in date are required",
            });
        }

        if (room_id !== null && room_id !== undefined && room_id !== "") {
            const [rooms] = await db.query(
                `
          SELECT
            r.id,
            r.capacity,
            COUNT(
              CASE
                WHEN t.status = 'Active' THEN 1
              END
            ) AS occupied_count
          FROM rooms r
          LEFT JOIN tenants t ON t.room_id = r.id
          WHERE r.id = ?
          GROUP BY r.id, r.capacity
        `,
                [room_id]
            );

            if (rooms.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Selected room not found",
                });
            }

            if (Number(rooms[0].occupied_count) >= Number(rooms[0].capacity)) {
                return res.status(409).json({
                    success: false,
                    message: "Selected room is already at full capacity",
                });
            }
        }

        const [result] = await db.query(
            `
        INSERT INTO tenants (
          full_name,
          contact_number,
          room_id,
          move_in_date,
          status
        )
        VALUES (?, ?, ?, ?, 'Active')
      `,
            [
                full_name.trim(),
                contact_number?.trim() || null,
                room_id || null,
                move_in_date,
            ]
        );

        res.status(201).json({
            success: true,
            message: "Tenant created successfully",
            data: {
                id: result.insertId,
            },
        });
    } catch (error) {
        console.error("Failed to create tenant:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create tenant",
        });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            full_name,
            contact_number,
            room_id,
            move_in_date,
            status,
        } = req.body;

        if (!full_name || !move_in_date || !status) {
            return res.status(400).json({
                success: false,
                message: "Full name, move-in date, and status are required",
            });
        }

        if (!["Active", "Inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Active or Inactive",
            });
        }

        const [tenantRows] = await db.query(
            `
        SELECT id, room_id, status
        FROM tenants
        WHERE id = ?
      `,
            [id]
        );

        if (tenantRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found",
            });
        }

        if (
            status === "Active" &&
            room_id !== null &&
            room_id !== undefined &&
            room_id !== ""
        ) {
            const [rooms] = await db.query(
                `
          SELECT
            r.id,
            r.capacity,
            COUNT(
              CASE
                WHEN t.status = 'Active' AND t.id <> ? THEN 1
              END
            ) AS occupied_count
          FROM rooms r
          LEFT JOIN tenants t ON t.room_id = r.id
          WHERE r.id = ?
          GROUP BY r.id, r.capacity
        `,
                [id, room_id]
            );

            if (rooms.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Selected room not found",
                });
            }

            if (Number(rooms[0].occupied_count) >= Number(rooms[0].capacity)) {
                return res.status(409).json({
                    success: false,
                    message: "Selected room is already at full capacity",
                });
            }
        }

        const [result] = await db.query(
            `
        UPDATE tenants
        SET
          full_name = ?,
          contact_number = ?,
          room_id = ?,
          move_in_date = ?,
          status = ?
        WHERE id = ?
      `,
            [
                full_name.trim(),
                contact_number?.trim() || null,
                room_id || null,
                move_in_date,
                status,
                id,
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found",
            });
        }

        res.json({
            success: true,
            message: "Tenant updated successfully",
        });
    } catch (error) {
        console.error("Failed to update tenant:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update tenant",
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Verify the tenant exists first
        const [tenantRows] = await db.query(
            `SELECT id, full_name FROM tenants WHERE id = ?`,
            [id]
        );

        if (tenantRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found",
            });
        }

        // Check for meter readings (ON DELETE RESTRICT — would fail at DB level)
        const [meterRows] = await db.query(
            `SELECT COUNT(*) AS cnt FROM meter_readings WHERE tenant_id = ?`,
            [id]
        );
        const meterCount = Number(meterRows[0].cnt);

        if (meterCount > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete tenant "${tenantRows[0].full_name}" — they have ${meterCount} meter reading${meterCount !== 1 ? "s" : ""} on record. Delete the meter readings first.`,
            });
        }

        // Check for billing records (ON DELETE RESTRICT — would fail at DB level)
        const [billingRows] = await db.query(
            `SELECT COUNT(*) AS cnt FROM billing_records WHERE tenant_id = ?`,
            [id]
        );
        const billingCount = Number(billingRows[0].cnt);

        if (billingCount > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete tenant "${tenantRows[0].full_name}" — they have ${billingCount} billing record${billingCount !== 1 ? "s" : ""} on record. Delete the billing records first.`,
            });
        }

        // Safe to delete — tenant_accounts row cascades automatically
        const [result] = await db.query(
            `DELETE FROM tenants WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found",
            });
        }

        res.json({
            success: true,
            message: `Tenant "${tenantRows[0].full_name}" deleted successfully`,
        });
    } catch (error) {
        console.error("Failed to delete tenant:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete tenant",
        });
    }
});

module.exports = router;
