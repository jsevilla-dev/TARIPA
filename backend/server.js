require("dotenv").config({
    path: "../.env",
});

const express = require("express");
const db = require("./config/db");
const roomsRouter = require("./routes/rooms");
const tenantsRouter = require("./routes/tenants");
const utilityRatesRouter = require("./routes/utilityRates");
const meterReadingsRouter = require("./routes/meterReadings");
const billingRouter = require("./routes/billing");
const clientAuthRouter = require("./routes/clientAuth");
const clientPortalRouter = require("./routes/clientPortal");
const clientAuth = require("./middleware/clientAuth");


const app = express();
const PORT = 5000;

app.use(express.json());

app.use("/api/rooms", roomsRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/utility-rates", utilityRatesRouter);
app.use("/api/meter-readings", meterReadingsRouter);
app.use("/api/billing", billingRouter);

// ── Client / Tenant Portal (new — does not affect admin routes) ──
app.use("/api/client", clientAuthRouter);
app.use("/api/client", clientAuth, clientPortalRouter);


app.get("/api/dashboard", async (req, res) => {
    try {
        const [tenantRows] = await db.query(`
            SELECT COUNT(*) AS total_tenants
            FROM tenants
            WHERE status = 'Active'
        `);

        const [roomRows] = await db.query(`
            SELECT
                COUNT(*) AS total_rooms,
                COALESCE(
                    SUM(
                        CASE
                            WHEN occupied_count < capacity THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS available_rooms
            FROM (
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
                GROUP BY r.id, r.capacity
            ) AS room_summary
        `);

        const [billingRows] = await db.query(`
            SELECT
                COUNT(
                    CASE
                        WHEN status = 'Pending' THEN 1
                    END
                ) AS pending_bills,
                COALESCE(
                    SUM(
                        CASE
                            WHEN status IN ('Pending', 'Overdue')
                            THEN total_amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS outstanding_amount
            FROM billing_records
        `);

        res.json({
            success: true,
            data: {
                total_tenants: Number(tenantRows[0].total_tenants),
                total_rooms: Number(roomRows[0].total_rooms),
                available_rooms: Number(roomRows[0].available_rooms),
                pending_bills: Number(billingRows[0].pending_bills),
                outstanding_amount: Number(
                    billingRows[0].outstanding_amount
                ),
            },
        });
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
        });
    }
});

app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            success: true,
            message: "TARIPA backend and database are running",
        });
    } catch (error) {
        console.error("Database health check failed:", error);

        res.status(500).json({
            success: false,
            message: "Backend is running, but database connection failed",
        });
    }
});

const server = app.listen(PORT, "127.0.0.1", () => {
    console.log(`TARIPA backend running on http://127.0.0.1:${PORT}`);
});

server.on("error", (error) => {
    console.error("Server error:", error);
});

server.on("close", () => {
    console.log("TARIPA backend server closed");
});