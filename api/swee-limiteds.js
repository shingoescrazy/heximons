// =========================
// /api/sweep-limiteds
// =========================
// Auto-sweeping version of fetch-limiteds.js. Instead of you picking
// start/end ranges by hand, this walks forward from `start`, in safe
// time-boxed chunks, and tells you where it got to and whether it
// thinks it ran off the end of the catalog -- so a caller (see
// scripts/merge-all-limiteds.mjs) can just keep calling it with
// nextStart until reachedEnd comes back true.
//
// GET /api/sweep-limiteds?start=1
// GET /api/sweep-limiteds?start=1&batchSize=100&maxEmptyBatches=10
//
// Response:
//   {
//     rangeChecked: { start, end },
//     nextStart: <id to pass as `start` next call, or null>,
//     reachedEnd: boolean,   // true once we hit maxEmptyBatches in a row
//     batchesRun: number,
//     foundCount: number,
//     failedBatches: [...],
//     items: [...]           // newly found limiteds in this chunk only
//   }

const DETAILS_URL = "https://hexium.zip/apisite/catalog/v1/catalog/items/details";
const BATCH_SIZE_DEFAULT = 100;
// How many consecutive batches can come back completely empty (no
// items at all, not just no limiteds) before we conclude we've swept
// past the highest real catalog ID and should stop.
const MAX_EMPTY_BATCHES_DEFAULT = 10;
// Leave headroom under whatever maxDuration this function is
// configured with (see vercel.json) so we always return a clean
// response instead of getting killed mid-batch.
const TIME_BUDGET_MS = 50_000;

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
        return { ok: false, ids, status: response.status, results: [] };
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
    const startedAt = Date.now();

    const start = Math.max(1, Number(req.query.start || 1));
    const batchSize = Math.max(1, Math.min(200, Number(req.query.batchSize || BATCH_SIZE_DEFAULT)));
    const maxEmptyBatches = Math.max(1, Number(req.query.maxEmptyBatches || MAX_EMPTY_BATCHES_DEFAULT));

    const limiteds = [];
    const failedBatches = [];

    let cursor = start;
    let batchesRun = 0;
    let consecutiveEmpty = 0;
    let reachedEnd = false;

    while (Date.now() - startedAt < TIME_BUDGET_MS) {
        const ids = [];
        for (let i = 0; i < batchSize; i++) ids.push(cursor + i);

        const result = await fetchBatch(ids);
        batchesRun++;

        if (!result.ok) {
            failedBatches.push({ ids, status: result.status });
            // A failed request (rate limit, transient error, etc.) is
            // not evidence we hit the end of the catalog -- don't
            // count it toward consecutiveEmpty, just move on.
        }
        else {
            if (result.results.length === 0) {
                consecutiveEmpty++;
            }
            else {
                consecutiveEmpty = 0;
            }

            result.results.forEach(item => {
                if (isLimitedItem(item)) {
                    limiteds.push(mapItem(item));
                }
            });
        }

        cursor += batchSize;

        if (consecutiveEmpty >= maxEmptyBatches) {
            reachedEnd = true;
            break;
        }
    }

    res.status(200).json({
        rangeChecked: { start, end: cursor - 1 },
        nextStart: reachedEnd ? null : cursor,
        reachedEnd,
        batchesRun,
        foundCount: limiteds.length,
        failedBatches,
        items: limiteds
    });
}
