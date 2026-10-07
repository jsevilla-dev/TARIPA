const express = require("express");
const db = require("../config/db");

const router = express.Router();

// GET all utility rates
router.get("/", async (req, res) => {
    try {
        const [rates] = await db.query(`
            SELECT
                id,
                utility_type,
                rate_per_unit,
                effective_from,
                created_at
            FROM utility_rates
            ORDER BY utility_type, effective_from DESC;
        `);

        res.json({
            success: true,
            data: rates,
        });
    } catch (error) {
        console.error("Failed to fetch utility rates:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch utility rates",
        });
    }
});

// POST a new utility rate
router.post("/", async (req, res) => {
    try {
        const {
            utility_type,
            rate_per_unit,
            effective_from,
        } = req.body;

        if (!utility_type || rate_per_unit === undefined || !effective_from) {
            return res.status(400).json({
                success: false,
                message: "Utility type, rate per unit, and effective date are required",
            });
        }

        if (!["Electricity", "Water"].includes(utility_type)) {
            return res.status(400).json({
                success: false,
                message: "Utility type must be Electricity or Water",
            });
        }

        if (
            Number.isNaN(Number(rate_per_unit)) ||
            Number(rate_per_unit) <= 0 ||
            Number(rate_per_unit) > 10000
        ) {
            return res.status(400).json({
                success: false,
                message: "Rate per unit must be between 0.01 and 10,000",
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO utility_rates (
                utility_type,
                rate_per_unit,
                effective_from
            )
            VALUES (?, ?, ?)
            `,
            [
                utility_type,
                Number(rate_per_unit),
                effective_from,
            ]
        );

        res.status(201).json({
            success: true,
            message: "Utility rate created successfully",
            data: {
                id: result.insertId,
                utility_type,
                rate_per_unit: Number(rate_per_unit),
                effective_from,
            },
        });
    } catch (error) {
        console.error("Failed to create utility rate:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "A utility rate already exists for this utility type and effective date",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create utility rate",
        });
    }
});

// PUT/update an existing utility rate
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            utility_type,
            rate_per_unit,
            effective_from,
        } = req.body;

        if (!utility_type || rate_per_unit === undefined || !effective_from) {
            return res.status(400).json({
                success: false,
                message: "Utility type, rate per unit, and effective date are required",
            });
        }

        if (!["Electricity", "Water"].includes(utility_type)) {
            return res.status(400).json({
                success: false,
                message: "Utility type must be Electricity or Water",
            });
        }

        if (
            Number.isNaN(Number(rate_per_unit)) ||
            Number(rate_per_unit) <= 0 ||
            Number(rate_per_unit) > 10000
        ) {
            return res.status(400).json({
                success: false,
                message: "Rate per unit must be between 0.01 and 10,000",
            });
        }

        const [result] = await db.query(
            `
            UPDATE utility_rates
            SET
                utility_type = ?,
                rate_per_unit = ?,
                effective_from = ?
            WHERE id = ?
            `,
            [
                utility_type,
                Number(rate_per_unit),
                effective_from,
                id,
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Utility rate not found",
            });
        }

        res.json({
            success: true,
            message: "Utility rate updated successfully",
        });
    } catch (error) {
        console.error("Failed to update utility rate:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "A utility rate already exists for this utility type and effective date",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update utility rate",
        });
    }
});

// DELETE a utility rate
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            `
            DELETE FROM utility_rates
            WHERE id = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Utility rate not found",
            });
        }

        res.json({
            success: true,
            message: "Utility rate deleted successfully",
        });
    } catch (error) {
        console.error("Failed to delete utility rate:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete utility rate",
        });
    }
});

module.exports = router;