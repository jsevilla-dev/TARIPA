const express = require("express");
const db = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [rooms] = await db.query(`
      SELECT
        r.id,
        r.room_number,
        r.capacity,
        COUNT(
          CASE
            WHEN t.status = 'Active' THEN 1
          END
        ) AS occupied_count
      FROM rooms r
      LEFT JOIN tenants t ON t.room_id = r.id
      GROUP BY r.id, r.room_number, r.capacity
      ORDER BY r.room_number;
    `);

        res.json({
            success: true,
            data: rooms,
        });
    } catch (error) {
        console.error("Failed to fetch rooms:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch rooms",
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { room_number, capacity } = req.body;

        if (!room_number || capacity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Room number and capacity are required",
            });
        }

        const roomNumTrimmed = String(room_number).trim();
        if (!roomNumTrimmed || !/^\d+$/.test(roomNumTrimmed)) {
            return res.status(400).json({
                success: false,
                message: "Room number must be numbers only (e.g. 101, 102)",
            });
        }
        if (roomNumTrimmed.length > 4) {
            return res.status(400).json({
                success: false,
                message: "Room number must be between 1 and 4 digits (e.g. 101, 102)",
            });
        }

        const capNum = Number(capacity);
        if (!Number.isInteger(capNum) || capNum <= 0 || capNum > 30) {
            return res.status(400).json({
                success: false,
                message: "Capacity must be a positive whole number between 1 and 30",
            });
        }

        const [result] = await db.query(
            `
        INSERT INTO rooms (room_number, capacity)
        VALUES (?, ?)
      `,
            [roomNumTrimmed, capNum]
        );

        res.status(201).json({
            success: true,
            message: "Room created successfully",
            data: {
                id: result.insertId,
                room_number: roomNumTrimmed,
                capacity: capNum,
            },
        });
    } catch (error) {
        console.error("Failed to create room:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Room number already exists",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create room",
        });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { room_number, capacity } = req.body;

        if (!room_number || capacity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Room number and capacity are required",
            });
        }

        const roomNumTrimmed = String(room_number).trim();
        if (!roomNumTrimmed || !/^\d+$/.test(roomNumTrimmed)) {
            return res.status(400).json({
                success: false,
                message: "Room number must be numbers only (e.g. 101, 102)",
            });
        }
        if (roomNumTrimmed.length > 4) {
            return res.status(400).json({
                success: false,
                message: "Room number must be between 1 and 4 digits (e.g. 101, 102)",
            });
        }

        const capNum = Number(capacity);
        if (!Number.isInteger(capNum) || capNum <= 0 || capNum > 30) {
            return res.status(400).json({
                success: false,
                message: "Capacity must be a positive whole number between 1 and 30",
            });
        }

        // Verify that capacity is not lower than active occupants
        const [occupantRows] = await db.query(
            "SELECT COUNT(*) AS active_tenants FROM tenants WHERE room_id = ? AND status = 'Active'",
            [id]
        );
        const currentActive = occupantRows[0]?.active_tenants || 0;
        if (capNum < currentActive) {
            return res.status(400).json({
                success: false,
                message: `Capacity cannot be lower than the current active tenants (${currentActive})`,
            });
        }

        const [result] = await db.query(
            `
        UPDATE rooms
        SET room_number = ?, capacity = ?
        WHERE id = ?
      `,
            [roomNumTrimmed, capNum, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        res.json({
            success: true,
            message: "Room updated successfully",
        });
    } catch (error) {
        console.error("Failed to update room:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Room number already exists",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update room",
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Check if any tenants are associated with this room
        const [tenantRows] = await db.query(
            "SELECT COUNT(*) AS tenant_count FROM tenants WHERE room_id = ?",
            [id]
        );
        if (tenantRows[0]?.tenant_count > 0) {
            return res.status(409).json({
                success: false,
                message: "Room cannot be deleted because tenants are assigned to it",
            });
        }

        const [result] = await db.query(
            `
        DELETE FROM rooms
        WHERE id = ?
      `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        res.json({
            success: true,
            message: "Room deleted successfully",
        });
    } catch (error) {
        console.error("Failed to delete room:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                success: false,
                message: "Room cannot be deleted because it has assigned tenants",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to delete room",
        });
    }
});

module.exports = router;