// =========================
// /api/account/start-link
// =========================
// POST { username: "SomeHexiumUser" }
// Looks up the Hexium user, generates a random verification phrase,
// and stores it (unverified) so it can be checked later.
//
// Response: { userId, username, phrase }

const crypto = require("crypto");
const { getPool } = require("../_db");

const HEXIUM_BASE = "https://hexium.zip";

function generatePhrase() {
    return "heximons-verify-" + crypto.randomBytes(5).toString("hex");
}

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Use POST" });
        return;
    }

    try {
        const username = String(req.body?.username || "").trim();

        if (!username || username.length > 50) {
            res.status(400).json({ error: "Provide a valid Hexium username." });
            return;
        }

        // Look up the user's id via Hexium's username lookup endpoint.
        const lookupResponse = await fetch(
            `${HEXIUM_BASE}/apisite/users/v1/usernames/users`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usernames: [username] })
            }
        );

        if (!lookupResponse.ok) {
            res.status(502).json({ error: "Hexium lookup failed. Try again." });
            return;
        }

        const lookupPayload = await lookupResponse.json();
        const entries = Array.isArray(lookupPayload?.data) ? lookupPayload.data : [];
        const match = entries[0];

        if (!match) {
            res.status(404).json({ error: "No Hexium user found with that username." });
            return;
        }

        const userId = Number(match.id ?? match.Id);
        const realUsername = String(match.name ?? match.Name ?? username);
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
            [userId, realUsername, phrase]
        );

        res.status(200).json({ userId, username: realUsername, phrase });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to start linking",
            message: error?.message || String(error)
        });
    }
};
