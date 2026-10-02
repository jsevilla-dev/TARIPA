/**
 * TARIPA — Tenant Account Provisioning Script
 * ─────────────────────────────────────────────
 * Usage:
 *   node scripts/create-tenant-account.js <tenant_id> <username> <password>
 *
 * Example:
 *   node scripts/create-tenant-account.js 2 maria.santos password123
 *
 * Run this from the TARIPA project root directory.
 */

require("../backend/node_modules/dotenv").config({ path: "./.env" });

const bcrypt = require("../backend/node_modules/bcrypt");
const mysql = require("../backend/node_modules/mysql2/promise");

async function main() {
    const [, , tenantIdArg, username, password] = process.argv;

    if (!tenantIdArg || !username || !password) {
        console.error(
            "Usage: node scripts/create-tenant-account.js <tenant_id> <username> <password>"
        );
        process.exit(1);
    }

    const tenantId = Number(tenantIdArg);

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
        console.error("tenant_id must be a positive integer.");
        process.exit(1);
    }

    if (username.length < 3 || username.length > 80) {
        console.error("Username must be between 3 and 80 characters.");
        process.exit(1);
    }

    if (password.length < 6) {
        console.error("Password must be at least 6 characters.");
        process.exit(1);
    }

    let db;
    try {
        db = await mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // Verify tenant exists and is Active
        const [tenantRows] = await db.query(
            "SELECT id, full_name, status FROM tenants WHERE id = ? LIMIT 1",
            [tenantId]
        );

        if (tenantRows.length === 0) {
            console.error(`No tenant found with id = ${tenantId}.`);
            process.exit(1);
        }

        const tenant = tenantRows[0];
        console.log(`Found tenant: ${tenant.full_name} (status: ${tenant.status})`);

        if (tenant.status !== "Active") {
            console.warn(
                `Warning: Tenant "${tenant.full_name}" is ${tenant.status}. Account will be created but login will be blocked until the tenant is Active.`
            );
        }

        // Hash the password (cost factor 12 for good security vs. speed)
        console.log("Hashing password...");
        const passwordHash = await bcrypt.hash(password, 12);

        // Insert account (will error if tenant_id or username already exists)
        await db.query(
            `INSERT INTO tenant_accounts (tenant_id, username, password_hash)
             VALUES (?, ?, ?)`,
            [tenantId, username.trim(), passwordHash]
        );

        console.log(
            `\n✅ Account created successfully!\n   Tenant: ${tenant.full_name} (id=${tenantId})\n   Username: ${username}\n\nThe tenant can now log in at the TARIPA client portal.`
        );
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            if (err.message.includes("tenant_id")) {
                console.error(
                    `An account already exists for tenant id ${tenantId}. Use the reset script to change the password.`
                );
            } else {
                console.error(
                    `The username "${username}" is already taken. Please choose a different username.`
                );
            }
            process.exit(1);
        }
        console.error("Failed to create account:", err.message);
        process.exit(1);
    } finally {
        if (db) await db.end();
    }
}

main();
