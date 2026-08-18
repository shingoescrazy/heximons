// =========================
// /api/admin/update-item
// =========================
// Protected endpoint the admin panel calls to save value/rap/demand/
// trend for a specific item id into the item_values table.
//
// POST https://heximons.vercel.app/api/admin/update-item
// Body (JSON):
//   {
//     "password": "...",
//     "id": 5401,
//     "value": 120000,
//     "rap": 95000,
//     "demand": "High",
//     "trend": "Raising"
//   }
//
// Requires an ADMIN_PASSWORD environment variable set in Vercel.
// This is a simple shared-password gate -- fine for a single admin
// (you) but not a substitute for real user accounts if you ever add
// multiple admins.

const { getPool } = require("../_db");

const VALID_DEMAND = ["Unassigned", "Terrible", "Low", "Decent", "High"];
const VALID_TREND = ["Stable", "Raising", "Lowering", "Unstable", "Fluctuating"];

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Use POST" });
        return;
    }

    try {
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            res.status(500).json({
                error: "Server not configured: ADMIN_PASSWORD environment variable is missing."
            });
            return;
        }

        const { password, id, value, rap, demand, trend } = req.body || {};

        if (password !== adminPassword) {
            res.status(401).json({ error: "Incorrect admin password" });
            return;
        }

        const itemId = Number(id);
        if (!Number.isInteger(itemId) || itemId <= 0) {
            res.status(400).json({ error: "Invalid item id" });
            return;
        }

        const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
        const safeRap = Number.isFinite(Number(rap)) ? Number(rap) : 0;
        const safeDemand = VALID_DEMAND.includes(demand) ? demand : "Unassigned";
        const safeTrend = VALID_TREND.includes(trend) ? trend : "Stable";

        const pool = getPool();

        await pool.query(
            `INSERT INTO item_values (id, value, rap, demand, trend)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                value = VALUES(value),
                rap = VALUES(rap),
                demand = VALUES(demand),
                trend = VALUES(trend)`,
            [itemId, safeValue, safeRap, safeDemand, safeTrend]
        );

        res.status(200).json({
            success: true,
            saved: { id: itemId, value: safeValue, rap: safeRap, demand: safeDemand, trend: safeTrend }
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to save item",
            message: error?.message || String(error)
        });
    }
};
