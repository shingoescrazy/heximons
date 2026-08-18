// =========================
// /api/account/start-link
// =========================
// POST { userId: 123, username: "SomeHexiumUser" }
// The client resolves the username -> userId via the browser (Hexium's
// lookup endpoint blocks server-to-server requests), then this route
// generates a verification phrase and stores it, unverified.
//
// Response: { userId, username, phrase }

const crypto = require("crypto");
const { getPool } = require("../_db");

function generatePhrase() {
    return "heximons-verify-" + crypto.randomBytes(5).toString("hex");
}

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Use POST" });
        return;
    }

    try {
        const userId = Number(req.body?.userId);
        const username = String(req.body?.username || "").trim();

        if (!Number.isInteger(userId) || userId <= 0 || !username) {
            res.status(400).json({ error: "Missing or invalid userId/username." });
            return;
        }

        const phrase = generatePhrase();

        const pool = getPool();
        await pool.query(
            `INSERT INTO linked_accounts (hexium_user_id, hexium_username, verification_phrase, verified, session_token, verified_at)
             VALUES (?, ?, ?, 0, NULL, NULL)
             ON DUPLICATE KEY UPDATE
                hexium_username = VALUES(hexium_username),
                verification_phrase = VALUES(verification_phrase),
                verified = 0,
                session_token = NULL,
                verified_at = NULL`,
            [userId, username, phrase]
        );

        res.status(200).json({ userId, username, phrase });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to start linking",
            message: error?.message || String(error)
        });
    }
};
