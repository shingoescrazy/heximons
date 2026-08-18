// =========================
// /api/account/verify
// =========================
// POST { userId: 123 }
// Fetches the user's Hexium profile, checks whether their stored
// verification phrase appears in their bio/description, and if so
// marks the link verified and issues a session token.
//
// Response: { verified: true, token, username } or { verified: false }

const crypto = require("crypto");
const { getPool } = require("../_db");

const HEXIUM_BASE = "https://hexium.zip";

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Use POST" });
        return;
    }

    try {
        const userId = Number(req.body?.userId);

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

        const profileResponse = await fetch(
            `${HEXIUM_BASE}/apisite/users/v1/users/${userId}`
        );

        if (!profileResponse.ok) {
            res.status(502).json({ error: "Could not fetch Hexium profile." });
            return;
        }

        const profile = await profileResponse.json();
        const bio = String(profile?.description ?? profile?.Description ?? "");

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
