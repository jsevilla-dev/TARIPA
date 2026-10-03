const express = require("express");
const db = require("../config/db");

const router = express.Router();

// GET billing records with filters
router.get("/", async (req, res) => {
    try {
        const { month, tenant_id, room_id, status } = req.query;

        let query = `
            SELECT
                b.id,
                b.tenant_id,
                t.full_name,
                t.room_id,
                r.room_number,
                DATE_FORMAT(b.billing_month, '%Y-%m-%d') AS billing_month,
                b.electricity_consumption,
                b.electricity_charge,
                b.water_consumption,
                b.water_charge,
                b.total_amount,
                b.status,
                b.created_at,
                b.updated_at
            FROM billing_records b
            INNER JOIN tenants t ON t.id = b.tenant_id
            LEFT JOIN rooms r ON r.id = t.room_id
            WHERE 1 = 1
        `;

        const params = [];

        if (month) {
            query += ` AND DATE_FORMAT(b.billing_month, '%Y-%m') = ?`;
            params.push(month);
        }

        if (tenant_id) {
            query += ` AND b.tenant_id = ?`;
            params.push(tenant_id);
        }

        if (room_id) {
            query += ` AND t.room_id = ?`;
            params.push(room_id);
        }

        if (status) {
            query += ` AND b.status = ?`;
            params.push(status);
        }

        query += `
            ORDER BY b.billing_month DESC, t.full_name
        `;

        const [billingRecords] = await db.query(query, params);

        res.json({
            success: true,
            data: billingRecords,
        });
    } catch (error) {
        console.error("Failed to fetch billing records:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch billing records",
        });
    }
});

// POST a new billing record
router.post("/", async (req, res) => {
    try {
        const { tenant_id, billing_month } = req.body;

        if (!tenant_id || !billing_month) {
            return res.status(400).json({
                success: false,
                message: "Tenant and billing month are required",
            });
        }

        const [tenantRows] = await db.query(
            `
            SELECT id, status
            FROM tenants
            WHERE id = ?
            `,
            [tenant_id]
        );

        if (tenantRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found",
            });
        }

        if (tenantRows[0].status !== "Active") {
            return res.status(409).json({
                success: false,
                message: "Billing can only be generated for an active tenant",
            });
        }

        const [meterRows] = await db.query(
            `
            SELECT
                electricity_previous,
                electricity_current,
                water_previous,
                water_current
            FROM meter_readings
            WHERE tenant_id = ?
              AND billing_month = ?
            `,
            [tenant_id, billing_month]
        );

        if (meterRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No meter reading found for this tenant and billing month",
            });
        }

        const meter = meterRows[0];

        const electricityConsumption =
            Number(meter.electricity_current) -
            Number(meter.electricity_previous);

        const waterConsumption =
            Number(meter.water_current) -
            Number(meter.water_previous);

        const [electricityRates] = await db.query(
            `
            SELECT rate_per_unit
            FROM utility_rates
            WHERE utility_type = 'Electricity'
              AND effective_from <= ?
            ORDER BY effective_from DESC
            LIMIT 1
            `,
            [billing_month]
        );

        const [waterRates] = await db.query(
            `
            SELECT rate_per_unit
            FROM utility_rates
            WHERE utility_type = 'Water'
              AND effective_from <= ?
            ORDER BY effective_from DESC
            LIMIT 1
            `,
            [billing_month]
        );

        if (electricityRates.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "No applicable electricity rate found for this billing month",
            });
        }

        if (waterRates.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "No applicable water rate found for this billing month",
            });
        }

        const electricityRate = Number(
            electricityRates[0].rate_per_unit
        );

        const waterRate = Number(
            waterRates[0].rate_per_unit
        );

        const electricityCharge =
            electricityConsumption * electricityRate;

        const waterCharge =
            waterConsumption * waterRate;

        const totalAmount =
            electricityCharge + waterCharge;

        const [result] = await db.query(
            `
            INSERT INTO billing_records (
                tenant_id,
                billing_month,
                electricity_consumption,
                electricity_charge,
                water_consumption,
                water_charge,
                total_amount,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
            `,
            [
                tenant_id,
                billing_month,
                electricityConsumption,
                electricityCharge,
                waterConsumption,
                waterCharge,
                totalAmount,
            ]
        );

        res.status(201).json({
            success: true,
            message: "Billing record created successfully",
            data: {
                id: result.insertId,
                tenant_id: Number(tenant_id),
                billing_month,
                electricity_consumption: electricityConsumption,
                electricity_rate: electricityRate,
                electricity_charge: electricityCharge,
                water_consumption: waterConsumption,
                water_rate: waterRate,
                water_charge: waterCharge,
                total_amount: totalAmount,
                status: "Pending",
            },
        });
    } catch (error) {
        console.error("Failed to create billing record:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "A billing record already exists for this tenant and billing month",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create billing record",
        });
    }
});

// PUT/update billing status
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Billing status is required",
            });
        }

        if (!["Pending", "Paid", "Overdue"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Pending, Paid, or Overdue",
            });
        }

        const [result] = await db.query(
            `
            UPDATE billing_records
            SET status = ?
            WHERE id = ?
            `,
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Billing record not found",
            });
        }

        res.json({
            success: true,
            message: "Billing status updated successfully",
            data: {
                id: Number(id),
                status,
            },
        });
    } catch (error) {
        console.error("Failed to update billing status:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update billing status",
        });
    }
});

// DELETE a billing record
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            `
            DELETE FROM billing_records
            WHERE id = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Billing record not found",
            });
        }

        res.json({
            success: true,
            message: "Billing record deleted successfully",
        });
    } catch (error) {
        console.error("Failed to delete billing record:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete billing record",
        });
    }
});

module.exports = router;