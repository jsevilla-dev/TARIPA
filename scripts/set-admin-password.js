/**
 * TARIPA — Admin Password Setup Script
 * ─────────────────────────────────────────────
 * Usage (run from the TARIPA project root):
 *   node scripts/set-admin-password.js <username> <password>
 *
 * Example:
 *   node scripts/set-admin-password.js admin MySecurePassword123!
 *
 * What it does:
 *   1. Hashes the supplied password with bcrypt (cost factor 12).
 *   2. Writes (or overwrites) ADMIN_USERNAME and ADMIN_PASSWORD_HASH
 *      in the root .env file.
 *   3. Never stores the plaintext password anywhere.
 */

const path = require("path");
const fs   = require("fs");
const bcrypt = require("../backend/node_modules/bcrypt");

const ENV_PATH = path.resolve(__dirname, "../.env");

async function main() {
    const [, , username, password] = process.argv;

    if (!username || !password) {
        console.error("Usage: node scripts/set-admin-password.js <username> <password>");
        process.exit(1);
    }

    if (username.length < 3 || username.length > 80) {
        console.error("Username must be between 3 and 80 characters.");
        process.exit(1);
    }

    if (password.length < 8) {
        console.error("Password must be at least 8 characters.");
        process.exit(1);
    }

    console.log("Hashing password (bcrypt cost 12)…");
    const hash = await bcrypt.hash(password, 12);

    // Read current .env, strip any existing ADMIN_* lines, append new ones
    let envContent = "";
    if (fs.existsSync(ENV_PATH)) {
        envContent = fs.readFileSync(ENV_PATH, "utf8");
    }

    // Remove existing ADMIN_USERNAME / ADMIN_PASSWORD_HASH lines
    envContent = envContent
        .split("\n")
        .filter((line) => !line.startsWith("ADMIN_USERNAME=") && !line.startsWith("ADMIN_PASSWORD_HASH="))
        .join("\n")
        .trimEnd();

    // Append new values
    envContent += `\nADMIN_USERNAME=${username}\nADMIN_PASSWORD_HASH=${hash}\n`;

    fs.writeFileSync(ENV_PATH, envContent, "utf8");

    console.log(`\n✅ Admin credentials configured successfully!`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: (bcrypt hash stored in .env — plaintext not saved)`);
    console.log(`\nRestart the backend server to pick up the new .env values.`);
}

main().catch((err) => {
    console.error("Failed:", err.message);
    process.exit(1);
});
