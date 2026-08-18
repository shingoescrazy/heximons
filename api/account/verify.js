// =========================
// /api/account/verify
// =========================
// POST { userId: 123, bio: "...current hexium bio text..." }
// The client fetches the user's current Hexium bio via the browser
// (same reason as start-link -- Hexium blocks server-to-server calls
// to some endpoints) and sends it here. This checks it against the
// stored phrase and, if it matches, issues a session token.
//
// Response: { verified: true, token, username } or { verified: false }

const crypto = require("crypto");
const { getPool } = require("../_db");

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Use POST" });
        return;
    }

    try {
        const userId = Number(req.body?.userId);
        const bio = String(req.body?.bio || "");

        if (!Number.isInteger(userId) || userId <= 0) {
            res.status(400).json({ error: "Invalid userId" });
            return;
        }

        const pool = getPool();
        const [rows] = await pool.query(
            "SELECT * FROM linked_accounts WHERE hexium_user_id = ?",
            [userId]
        );
        const record = rows[0];

        if (!record) {
            res.status(404).json({ error: "No pending link found for this user. Start linking again." });
            return;
        }

        if (!bio.includes(record.verification_phrase)) {
            res.status(200).json({
                verified: false,
                message: "Phrase not found in your Hexium bio yet. Make sure you saved it and try again."
            });
            return;
        }

        const token = crypto.randomBytes(24).toString("hex");

        await pool.query(
            `UPDATE linked_accounts
             SET verified = 1, session_token = ?, verified_at = CURRENT_TIMESTAMP
             WHERE hexium_user_id = ?`,
            [token, userId]
        );

        res.status(200).json({
            verified: true,
            token,
            username: record.hexium_username
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to verify",
            message: error?.message || String(error)
        });
    }
};
