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

const app = express();
const PORT = 5000;

app.use(express.json());

app.use("/api/rooms", roomsRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/utility-rates", utilityRatesRouter);
app.use("/api/meter-readings", meterReadingsRouter);
app.use("/api/billing", billingRouter);

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