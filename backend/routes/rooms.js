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

        if (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Capacity must be a positive whole number",
            });
        }

        const [result] = await db.query(
            `
        INSERT INTO rooms (room_number, capacity)
        VALUES (?, ?)
      `,
            [room_number.trim(), Number(capacity)]
        );

        res.status(201).json({
            success: true,
            message: "Room created successfully",
            data: {
                id: result.insertId,
                room_number: room_number.trim(),
                capacity: Number(capacity),
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

        if (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Capacity must be a positive whole number",
            });
        }

        const [result] = await db.query(
            `
        UPDATE rooms
        SET room_number = ?, capacity = ?
        WHERE id = ?
      `,
            [room_number.trim(), Number(capacity), id]
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