// =========================
// FETCH HEXIUM LIMITEDS
// =========================
// Sweeps asset IDs against Hexium's catalog/items/details endpoint,
// keeps only items flagged as Limited/LimitedUnique/Collectible, and
// writes the result to data/items.json in the shape the site expects.
//
// Usage:
//   node scripts/fetch-limiteds.js [maxId] [batchSize]
//
// Examples:
//   node scripts/fetch-limiteds.js            # sweeps 1-6000, batch 50
//   node scripts/fetch-limiteds.js 8000        # sweeps 1-8000
//   node scripts/fetch-limiteds.js 8000 100    # sweeps 1-8000, batch 100
//
// Requires Node 18+ (built-in fetch). Run with:
//   node scripts/fetch-limiteds.js
//
// IMPORTANT: This calls hexium.zip directly from your machine (not
// through the Vercel proxy), so it is NOT subject to the browser CORS
// restriction mentioned in the README — that restriction only applies
// to requests made from a browser tab.

const fs = require("fs");
const path = require("path");

const DETAILS_URL = "https://hexium.zip/apisite/catalog/v1/catalog/items/details";
const OUTPUT_PATH = path.join(__dirname, "..", "data", "items.json");

const MAX_ID = Number(process.argv[2] || 6000);
const BATCH_SIZE = Number(process.argv[3] || 50);
const REQUEST_DELAY_MS = 150; // be polite to the server between batches

// Known Roblox-style assetType IDs -> friendly names.
// Extend this if Hexium uses different codes; unknown codes fall back
// to "Unknown" and are logged so you can add them.
const ASSET_TYPE_NAMES = {
    8: "Hat",
    41: "HairAccessory",
    42: "FaceAccessory",
    43: "NeckAccessory",
    44: "ShoulderAccessory",
    45: "FrontAccessory",
    46: "BackAccessory",
    47: "WaistAccessory",
    17: "Head",
    18: "Face",
    19: "Gear",
    2: "Face"
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isLimitedItem(item) {
    const restrictions = item.itemRestrictions || item.ItemRestrictions || [];
    const restrictionSet = new Set(
        restrictions.map(r => String(r).toLowerCase())
    );

    return (
        restrictionSet.has("limited") ||
        restrictionSet.has("limitedunique") ||
        restrictionSet.has("collectible") ||
        item.isLimited === true ||
        item.isLimitedUnique === true
    );
}

function mapItem(item) {
    const id = Number(item.id ?? item.Id);
    const name = String(item.name ?? item.Name ?? "Unknown Item");
    const assetTypeId = Number(item.assetType ?? item.AssetType ?? 0);
    const type = ASSET_TYPE_NAMES[assetTypeId] || "Unknown";

    const price = Number(item.price ?? item.Price ?? 0);
    const totalQuantity = item.totalQuantity ?? item.TotalQuantity ?? null;

    return {
        id,
        name,
        acronym: "",
        type,
        category: "Hexium Limited",
        rarity: "",
        // Hexium's catalog endpoint doesn't expose RAP/value/demand/trend
        // analytics (Roblox itself doesn't either -- that's what
        // Rolimons-style trackers compute separately). These default to
        // placeholders here and are meant to be set via the admin panel.
        value: price || 0,
        rap: 0,
        rapAfterSale: 0,
        bestPrice: price || 0,
        demand: "Unassigned",
        trend: "Stable",
        availableCopies: totalQuantity ?? 0,
        premiumCopies: 0,
        avgDailySales: 0,
        totalCopies: totalQuantity ?? 0,
        deletedCopies: 0,
        owners: 0,
        premiumOwners: 0,
        hoardedCopies: 0,
        percentHoarded: 0,
        image: "",
        robloxUrl: "",
        projected: false,
        tablet: false,
        unobtainable: false
    };
}

async function fetchBatch(ids) {
    const body = JSON.stringify(
        ids.map(id => ({ itemType: "Asset", id }))
    );

    const response = await fetch(DETAILS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
    });

    if (!response.ok) {
        throw new Error(
            `Batch [${ids[0]}-${ids[ids.length - 1]}] failed: HTTP ${response.status}`
        );
    }

    const payload = await response.json();

    // Real Roblox-style responses wrap results in { data: [...] }.
    // Fall back to a bare array in case Hexium responds differently.
    return Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
            ? payload
            : [];
}

async function main() {
    console.log(`Sweeping asset IDs 1-${MAX_ID} in batches of ${BATCH_SIZE}...`);

    const allIds = Array.from({ length: MAX_ID }, (_, i) => i + 1);
    const limiteds = [];
    let checked = 0;
    let errors = 0;

    for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
        const batch = allIds.slice(i, i + BATCH_SIZE);

        try {
            const results = await fetchBatch(batch);

            results.forEach(item => {
                if (isLimitedItem(item)) {
                    limiteds.push(mapItem(item));
                }
            });
        }
        catch (error) {
            errors += 1;
            console.warn(error.message);
        }

        checked += batch.length;

        if (checked % 500 === 0 || checked === allIds.length) {
            console.log(
                `  ...checked ${checked}/${allIds.length} (found ${limiteds.length} limiteds so far)`
            );
        }

        await sleep(REQUEST_DELAY_MS);
    }

    // Re-number sequential ids for the site's internal use, but keep
    // the real Hexium asset id around too in case it's needed later.
    const finalItems = limiteds.map((item, index) => ({
        ...item,
        siteId: index + 1
    }));

    fs.writeFileSync(
        OUTPUT_PATH,
        JSON.stringify(finalItems, null, 4),
        "utf8"
    );

    console.log(`\nDone. Found ${finalItems.length} limiteds.`);
    console.log(`Failed batches: ${errors}`);
    console.log(`Written to ${OUTPUT_PATH}`);

    if (finalItems.length === 0) {
        console.log(
            "\nNo limiteds found. This usually means the itemRestrictions " +
            "field uses different values than expected. Re-run with a " +
            "small MAX_ID (e.g. 20) and add a console.log(item) inside " +
            "fetchBatch's results.forEach to inspect the raw shape, then " +
            "tell me what you see so I can fix the isLimitedItem() check."
        );
    }
}

main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});
