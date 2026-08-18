// =========================
// DATABASE CONNECTION HELPER
// =========================
// Shared by any /api function that needs to talk to MySQL.
// Reads credentials from Vercel Environment Variables -- never
// hardcode real credentials here.
//
// Required Environment Variables (set in Vercel > Settings >
// Environment Variables):
//   DB_HOST
//   DB_PORT
//   DB_USER
//   DB_PASSWORD
//   DB_NAME

const mysql = require("mysql2/promise");

let pool = null;

function getPool() {
    if (pool) return pool;

    const required = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}`
        );
    }

    pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0
    });

    return pool;
}

module.exports = { getPool };
