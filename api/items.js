// =========================
// /api/items
// =========================
// Returns the full catalog, with any admin-set values (from MySQL)
// merged on top of the base catalog data in data/items.json.
//
// GET https://heximons.vercel.app/api/items

const fs = require("fs");
const path = require("path");
const { getPool } = require("./_db");

const ITEMS_PATH = path.join(process.cwd(), "data", "items.json");

module.exports = async (req, res) => {
    try {
        const raw = fs.readFileSync(ITEMS_PATH, "utf8");
        const baseItems = JSON.parse(raw);

        let overridesById = {};

        try {
            const pool = getPool();
            const [rows] = await pool.query("SELECT * FROM item_values");
            overridesById = Object.fromEntries(rows.map(row => [row.id, row]));
        }
        catch (dbError) {
            // If the DB isn't reachable/configured yet, fall back to
            // showing the base catalog data instead of failing the
            // whole page. Logged so it's visible in Vercel's logs.
            console.warn("DB unavailable, serving base catalog only:", dbError.message);
        }

        const merged = baseItems.map(item => {
            const override = overridesById[item.id];
            if (!override) return item;

            return {
                ...item,
                value: override.value ?? item.value,
                rap: override.rap ?? item.rap,
                demand: override.demand ?? item.demand,
                trend: override.trend ?? item.trend
            };
        });

        res.status(200).json(merged);
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to load items",
            message: error?.message || String(error)
        });
    }
};
