const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, "../.env"),
});

const express = require("express");
const db = require("./config/db");
const roomsRouter = require("./routes/rooms");
const tenantsRouter = require("./routes/tenants");
const utilityRatesRouter = require("./routes/utilityRates");
const meterReadingsRouter = require("./routes/meterReadings");
const billingRouter = require("./routes/billing");
const clientAuthRouter  = require("./routes/clientAuth");
const clientPortalRouter = require("./routes/clientPortal");
const clientAuth        = require("./middleware/clientAuth");
const adminAuthRouter   = require("./routes/adminAuth");
const adminAuth         = require("./middleware/adminAuth");


const app = express();
const PORT = 5000;

app.use(express.json());

// -- Admin Auth (login - public endpoint) --
app.use("/api/admin", adminAuthRouter);

// -- Admin-protected CRUD routes --
app.use("/api/rooms",          adminAuth, roomsRouter);
app.use("/api/tenants",        adminAuth, tenantsRouter);
app.use("/api/utility-rates",  adminAuth, utilityRatesRouter);
app.use("/api/meter-readings", adminAuth, meterReadingsRouter);
app.use("/api/billing",        adminAuth, billingRouter);

// -- Client / Tenant Portal (unchanged) --
app.use("/api/client", clientAuthRouter);
app.use("/api/client", clientAuth, clientPortalRouter);


app.get("/api/dashboard", adminAuth, async (req, res) => {
    try {
        const [tenantRows] = await db.query(`
            SELECT COUNT(*) AS total_tenants
            FROM tenants
            WHERE status = 'Active'
        `);

        const [roomRows] = await db.query(`
            SELECT
                COUNT(*) AS total_rooms,
                COALESCE(SUM(capacity), 0) AS total_capacity,
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
                        WHEN status IN ('Pending', 'Overdue') THEN 1
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
                ) AS outstanding_amount,
                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'Paid'
                            THEN total_amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_collected
            FROM billing_records
        `);

        const [utilityRows] = await db.query(`
            SELECT
                COALESCE(SUM(electricity_consumption), 0) AS total_electricity_kwh,
                COALESCE(SUM(electricity_charge), 0) AS total_electricity_cost,
                COALESCE(SUM(water_consumption), 0) AS total_water_cum,
                COALESCE(SUM(water_charge), 0) AS total_water_cost
            FROM billing_records
        `);

        const [highestUsageRoom] = await db.query(`
            SELECT
                r.room_number,
                SUM(b.electricity_consumption) AS electricity_kwh
            FROM billing_records b
            INNER JOIN tenants t ON t.id = b.tenant_id
            INNER JOIN rooms r ON r.id = t.room_id
            GROUP BY r.id, r.room_number
            ORDER BY electricity_kwh DESC
            LIMIT 1
        `);

        res.json({
            success: true,
            data: {
                total_tenants: Number(tenantRows[0].total_tenants || 0),
                total_rooms: Number(roomRows[0].total_rooms || 0),
                total_capacity: Number(roomRows[0].total_capacity || 0),
                available_rooms: Number(roomRows[0].available_rooms || 0),
                pending_bills: Number(billingRows[0].pending_bills || 0),
                outstanding_amount: Number(billingRows[0].outstanding_amount || 0),
                total_collected: Number(billingRows[0].total_collected || 0),
                electricity: {
                    kwh: Number(utilityRows[0]?.total_electricity_kwh || 0),
                    cost: Number(utilityRows[0]?.total_electricity_cost || 0),
                },
                water: {
                    cum: Number(utilityRows[0]?.total_water_cum || 0),
                    cost: Number(utilityRows[0]?.total_water_cost || 0),
                },
                highest_usage_room: highestUsageRoom.length > 0 ? {
                    room_number: highestUsageRoom[0].room_number,
                    kwh: Number(highestUsageRoom[0].electricity_kwh || 0),
                } : null,
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
