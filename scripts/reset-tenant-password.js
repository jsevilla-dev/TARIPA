/**
 * TARIPA — Tenant Password Reset Script
 * ─────────────────────────────────────────────
 * Usage:
 *   node scripts/reset-tenant-password.js <tenant_id> <new_password>
 *
 * Example:
 *   node scripts/reset-tenant-password.js 2 newpassword123
 *
 * What it does:
 *   1. Verifies the tenant exists in the tenants table.
 *   2. Verifies a tenant_account row exists for that tenant_id.
 *   3. Hashes the new password with bcrypt (cost factor 12 — same as
 *      create-tenant-account.js).
 *   4. Updates only the password_hash column in tenant_accounts.
 *   5. Never prints or stores the plaintext password.
 *
 * Run from the TARIPA project root directory.
 */

require("../backend/node_modules/dotenv").config({ path: "./.env" });

const bcrypt = require("../backend/node_modules/bcrypt");
const mysql  = require("../backend/node_modules/mysql2/promise");

async function main() {
    const [, , tenantIdArg, password] = process.argv;

    if (!tenantIdArg || !password) {
        console.error(
            "Usage: node scripts/reset-tenant-password.js <tenant_id> <new_password>"
        );
        process.exit(1);
    }

    const tenantId = Number(tenantIdArg);

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
        console.error("tenant_id must be a positive integer.");
        process.exit(1);
    }

    if (password.length < 6) {
        console.error("Password must be at least 6 characters.");
        process.exit(1);
    }

    let db;
    try {
        db = await mysql.createPool({
            host:     process.env.DB_HOST,
            port:     process.env.DB_PORT,
            user:     process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // 1. Verify the tenant exists
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
                `Warning: Tenant "${tenant.full_name}" is ${tenant.status}. ` +
                `Password will be updated but login will be blocked until the tenant is Active.`
            );
        }

        // 2. Verify an account already exists for this tenant
        const [accountRows] = await db.query(
            "SELECT id, username FROM tenant_accounts WHERE tenant_id = ? LIMIT 1",
            [tenantId]
        );

        if (accountRows.length === 0) {
            console.error(
                `No account found for tenant id ${tenantId}. ` +
                `Use create-tenant-account.js to create one first.`
            );
            process.exit(1);
        }

        const account = accountRows[0];
        console.log(`Found account: username="${account.username}" (account_id=${account.id})`);

        // 3. Hash the new password — cost factor 12, matching create-tenant-account.js
        console.log("Hashing password...");
        const newHash = await bcrypt.hash(password, 12);

        // 4. Update ONLY the password_hash; do not touch any other column
        const [result] = await db.query(
            "UPDATE tenant_accounts SET password_hash = ? WHERE tenant_id = ?",
            [newHash, tenantId]
        );

        if (result.affectedRows !== 1) {
            console.error("Unexpected: UPDATE affected 0 rows. No change was made.");
            process.exit(1);
        }

        console.log(
            `\n✅ Password reset successfully!\n` +
            `   Tenant:   ${tenant.full_name} (id=${tenantId})\n` +
            `   Username: ${account.username}\n` +
            `   Password: (bcrypt hash stored in DB — plaintext not saved)\n\n` +
            `The tenant can now log in with the new password.`
        );
    } catch (err) {
        console.error("Failed to reset password:", err.message);
        process.exit(1);
    } finally {
        if (db) await db.end();
    }
}

main();
