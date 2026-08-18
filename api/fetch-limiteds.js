// =========================
// /api/fetch-limiteds
// =========================
// Vercel serverless function (real Node.js, server-side -- no CORS
// issues calling hexium.zip). Visit this URL directly in your browser
// to run a sweep and get back JSON.
//
// Usage (as a URL in your browser, on your deployed site):
//   https://heximons.vercel.app/api/fetch-limiteds?start=1&end=1000
//
// Do a few ranges at a time (e.g. 1-1000, 1001-2000, ...) to stay
// under Vercel's function time limit. Copy each response and send it
// back, and it'll get merged into data/items.json.

const DETAILS_URL = "https://hexium.zip/apisite/catalog/v1/catalog/items/details";
const BATCH_SIZE = 100;

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
        return { ok: false, ids, status: response.status };
    }

    const payload = await response.json();
    const results = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
            ? payload
            : [];

    return { ok: true, results };
}

export default async function handler(req, res) {
    const start = Math.max(1, Number(req.query.start || 1));
    const end = Math.max(start, Number(req.query.end || start + 999));

    if (end - start > 2000) {
        res.status(400).json({
            error: "Range too large. Keep (end - start) under 2000 to avoid timing out."
        });
        return;
    }

    const ids = [];
    for (let i = start; i <= end; i++) ids.push(i);

    const limiteds = [];
    const failedBatches = [];

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const result = await fetchBatch(batch);

        if (!result.ok) {
            failedBatches.push({ ids: batch, status: result.status });
            continue;
        }

        result.results.forEach(item => {
            if (isLimitedItem(item)) {
                limiteds.push(mapItem(item));
            }
        });
    }

    res.status(200).json({
        rangeChecked: { start, end },
        foundCount: limiteds.length,
        failedBatches,
        items: limiteds
    });
}
