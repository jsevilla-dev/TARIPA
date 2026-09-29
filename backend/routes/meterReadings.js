const express = require("express");
const db = require("../config/db");

const router = express.Router();

// GET all meter readings
router.get("/", async (req, res) => {
    try {
        const [readings] = await db.query(`
            SELECT
                m.id,
                m.tenant_id,
                t.full_name,
                r.room_number,
                m.billing_month,
                m.electricity_previous,
                m.electricity_current,
                (m.electricity_current - m.electricity_previous) AS electricity_consumption,
                m.water_previous,
                m.water_current,
                (m.water_current - m.water_previous) AS water_consumption,
                m.recorded_at
            FROM meter_readings m
            INNER JOIN tenants t ON t.id = m.tenant_id
            LEFT JOIN rooms r ON r.id = t.room_id
            ORDER BY m.billing_month DESC, t.full_name;
        `);

        res.json({
            success: true,
            data: readings,
        });
    } catch (error) {
        console.error("Failed to fetch meter readings:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch meter readings",
        });
    }
});

// POST a new meter reading
router.post("/", async (req, res) => {
    try {
        const {
            tenant_id,
            billing_month,
            electricity_previous,
            electricity_current,
            water_previous,
            water_current,
        } = req.body;

        if (
            !tenant_id ||
            !billing_month ||
            electricity_previous === undefined ||
            electricity_current === undefined ||
            water_previous === undefined ||
            water_current === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Tenant, billing month, and all meter readings are required",
            });
        }

        const electricityPrevious = Number(electricity_previous);
        const electricityCurrent = Number(electricity_current);
        const waterPrevious = Number(water_previous);
        const waterCurrent = Number(water_current);

        const readings = [
            electricityPrevious,
            electricityCurrent,
            waterPrevious,
            waterCurrent,
        ];

        if (readings.some((value) => Number.isNaN(value) || value < 0)) {
            return res.status(400).json({
                success: false,
                message: "Meter readings must be non-negative numbers",
            });
        }

        if (electricityCurrent < electricityPrevious) {
            return res.status(400).json({
                success: false,
                message: "Current electricity reading cannot be lower than the previous reading",
            });
        }

        if (waterCurrent < waterPrevious) {
            return res.status(400).json({
                success: false,
                message: "Current water reading cannot be lower than the previous reading",
            });
        }

        const [tenants] = await db.query(
            `
            SELECT id, status
            FROM tenants
            WHERE id = ?
            `,
            [tenant_id]
        );

        if (tenants.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found",
            });
        }

        if (tenants[0].status !== "Active") {
            return res.status(409).json({
                success: false,
                message: "Meter reading can only be recorded for an active tenant",
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO meter_readings (
                tenant_id,
                billing_month,
                electricity_previous,
                electricity_current,
                water_previous,
                water_current
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                tenant_id,
                billing_month,
                electricityPrevious,
                electricityCurrent,
                waterPrevious,
                waterCurrent,
            ]
        );

        res.status(201).json({
            success: true,
            message: "Meter reading recorded successfully",
            data: {
                id: result.insertId,
                tenant_id: Number(tenant_id),
                billing_month,
                electricity_consumption:
                    electricityCurrent - electricityPrevious,
                water_consumption:
                    waterCurrent - waterPrevious,
            },
        });
    } catch (error) {
        console.error("Failed to record meter reading:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "A meter reading already exists for this tenant and billing month",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to record meter reading",
        });
    }
});

// PUT/update an existing meter reading
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            tenant_id,
            billing_month,
            electricity_previous,
            electricity_current,
            water_previous,
            water_current,
        } = req.body;

        if (
            !tenant_id ||
            !billing_month ||
            electricity_previous === undefined ||
            electricity_current === undefined ||
            water_previous === undefined ||
            water_current === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Tenant, billing month, and all meter readings are required",
            });
        }

        const electricityPrevious = Number(electricity_previous);
        const electricityCurrent = Number(electricity_current);
        const waterPrevious = Number(water_previous);
        const waterCurrent = Number(water_current);

        const readings = [
            electricityPrevious,
            electricityCurrent,
            waterPrevious,
            waterCurrent,
        ];

        if (readings.some((value) => Number.isNaN(value) || value < 0)) {
            return res.status(400).json({
                success: false,
                message: "Meter readings must be non-negative numbers",
            });
        }

        if (electricityCurrent < electricityPrevious) {
            return res.status(400).json({
                success: false,
                message: "Current electricity reading cannot be lower than the previous reading",
            });
        }

        if (waterCurrent < waterPrevious) {
            return res.status(400).json({
                success: false,
                message: "Current water reading cannot be lower than the previous reading",
            });
        }

        const [tenants] = await db.query(
            `
            SELECT id, status
            FROM tenants
            WHERE id = ?
            `,
            [tenant_id]
        );

        if (tenants.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found",
            });
        }

        if (tenants[0].status !== "Active") {
            return res.status(409).json({
                success: false,
                message: "Meter reading can only be recorded for an active tenant",
            });
        }

        const [result] = await db.query(
            `
            UPDATE meter_readings
            SET
                tenant_id = ?,
                billing_month = ?,
                electricity_previous = ?,
                electricity_current = ?,
                water_previous = ?,
                water_current = ?
            WHERE id = ?
            `,
            [
                tenant_id,
                billing_month,
                electricityPrevious,
                electricityCurrent,
                waterPrevious,
                waterCurrent,
                id,
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Meter reading not found",
            });
        }

        res.json({
            success: true,
            message: "Meter reading updated successfully",
            data: {
                id: Number(id),
                tenant_id: Number(tenant_id),
                billing_month,
                electricity_consumption:
                    electricityCurrent - electricityPrevious,
                water_consumption:
                    waterCurrent - waterPrevious,
            },
        });
    } catch (error) {
        console.error("Failed to update meter reading:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "A meter reading already exists for this tenant and billing month",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update meter reading",
        });
    }
});

// DELETE a meter reading
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            `
            DELETE FROM meter_readings
            WHERE id = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Meter reading not found",
            });
        }

        res.json({
            success: true,
            message: "Meter reading deleted successfully",
        });
    } catch (error) {
        console.error("Failed to delete meter reading:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete meter reading",
        });
    }
});

module.exports = router;