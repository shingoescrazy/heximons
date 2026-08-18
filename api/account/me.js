// =========================
// /api/account/me
// =========================
// GET /api/account/me?token=...
// Returns the linked Hexium account for a given session token, if valid.

const { getPool } = require("../_db");

module.exports = async (req, res) => {
    try {
        const token = String(req.query?.token || "").trim();

        if (!token) {
            res.status(400).json({ error: "Missing token" });
            return;
        }

        const pool = getPool();
        const [rows] = await pool.query(
            "SELECT hexium_user_id, hexium_username, verified_at FROM linked_accounts WHERE session_token = ? AND verified = 1",
            [token]
        );

        const record = rows[0];

        if (!record) {
            res.status(401).json({ error: "Invalid or expired token" });
            return;
        }

        res.status(200).json({
            userId: record.hexium_user_id,
            username: record.hexium_username,
            verifiedAt: record.verified_at
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to look up account",
            message: error?.message || String(error)
        });
    }
};
