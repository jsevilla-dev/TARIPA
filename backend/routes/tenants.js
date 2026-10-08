const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../config/db");

const router = express.Router();

function validateFullName(name) {
    if (!name || typeof name !== "string") {
        return "Full name is required";
    }
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.length < 3 || clean.length > 60) {
        return "Full name must be between 3 and 60 characters";
    }
    if (!/^[a-zA-Z\s.\-']+$/.test(clean)) {
        return "Full name must contain letters only";
    }
    if (/(.)\1{2,}/i.test(clean)) {
        return "Full name cannot contain repeating characters (e.g. 'ddd')";
    }
    const words = clean.split(" ").filter(Boolean);
    if (words.length < 2) {
        return "Please enter a valid full name with both First Name and Last Name (e.g. Juan Dela Cruz)";
    }
    const invalidWord = words.find((part) => {
        const cleanWord = part.replace(/[^a-zA-Z]/g, "").toLowerCase();
        if (cleanWord.length === 1) return false;
        if (["jr", "sr", "ii", "iii", "iv", "v"].includes(cleanWord)) return false;
        return cleanWord.length < 2 || !/[aeiouy]/.test(cleanWord);
    });
    if (invalidWord) {
        return `"${invalidWord}" does not appear to be a valid name`;
    }
    return null;
}

function formatFullName(name) {
    const words = name.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
    return words.map(w => {
        if (["ii", "iii", "iv"].includes(w.toLowerCase())) return w.toUpperCase();
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(" ");
}

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
        t.created_at,
        ta.username
      FROM tenants t
      LEFT JOIN rooms r ON r.id = t.room_id
      LEFT JOIN tenant_accounts ta ON ta.tenant_id = t.id
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

        const nameError = validateFullName(full_name);
        if (nameError) {
            return res.status(400).json({
                success: false,
                message: nameError,
            });
        }
        const formattedName = formatFullName(full_name);

        const trimmedContact = contact_number ? String(contact_number).trim() : null;
        if (trimmedContact && !/^\d{7,15}$/.test(trimmedContact)) {
            return res.status(400).json({
                success: false,
                message: "Contact number must contain digits only (7-15 digits)",
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
                formattedName,
                trimmedContact || null,
                room_id || null,
                move_in_date,
            ]
        );

        const newTenantId = result.insertId;

        // Auto-provision tenant login account
        const nameParts = formattedName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .split(/\s+/)
            .filter(Boolean);
        let baseUsername =
            nameParts.length >= 2
                ? `${nameParts[0]}.${nameParts.slice(1).join("")}`
                : nameParts[0] || `tenant${newTenantId}`;
        baseUsername = baseUsername.slice(0, 70);

        let finalUsername = baseUsername;
        let suffix = 1;
        while (true) {
            const [existing] = await db.query(
                "SELECT id FROM tenant_accounts WHERE username = ? LIMIT 1",
                [finalUsername]
            );
            if (existing.length === 0) break;
            suffix += 1;
            finalUsername = `${baseUsername}${suffix}`;
        }

        const defaultPassword = "taripa2026";
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        await db.query(
            "INSERT INTO tenant_accounts (tenant_id, username, password_hash) VALUES (?, ?, ?)",
            [newTenantId, finalUsername, passwordHash]
        );

        res.status(201).json({
            success: true,
            message: `Tenant registered successfully! Portal login: ${finalUsername} (Default Password: ${defaultPassword})`,
            data: {
                id: newTenantId,
                username: finalUsername,
                default_password: defaultPassword,
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

        const nameError = validateFullName(full_name);
        if (nameError) {
            return res.status(400).json({
                success: false,
                message: nameError,
            });
        }
        const formattedName = formatFullName(full_name);

        const trimmedContact = contact_number ? String(contact_number).trim() : null;
        if (trimmedContact && !/^\d{7,15}$/.test(trimmedContact)) {
            return res.status(400).json({
                success: false,
                message: "Contact number must contain digits only (7-15 digits)",
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
                formattedName,
                trimmedContact || null,
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

        // Check for meter readings (ON DELETE RESTRICT - would fail at DB level)
        const [meterRows] = await db.query(
            `SELECT COUNT(*) AS cnt FROM meter_readings WHERE tenant_id = ?`,
            [id]
        );
        const meterCount = Number(meterRows[0].cnt);

        if (meterCount > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete tenant "${tenantRows[0].full_name}" - they have ${meterCount} meter reading${meterCount !== 1 ? "s" : ""} on record. Delete the meter readings first.`,
            });
        }

        // Check for billing records (ON DELETE RESTRICT - would fail at DB level)
        const [billingRows] = await db.query(
            `SELECT COUNT(*) AS cnt FROM billing_records WHERE tenant_id = ?`,
            [id]
        );
        const billingCount = Number(billingRows[0].cnt);

        if (billingCount > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete tenant "${tenantRows[0].full_name}" - they have ${billingCount} billing record${billingCount !== 1 ? "s" : ""} on record. Delete the billing records first.`,
            });
        }

        // Safe to delete - tenant_accounts row cascades automatically
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
