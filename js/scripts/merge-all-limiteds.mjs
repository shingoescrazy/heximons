// =========================
// merge-all-limiteds.mjs
// =========================
// Drives /api/sweep-limiteds end-to-end and merges every Hexium
// limited it finds into data/items.json. Run this locally with
// Node 18+ (needs the built-in `fetch`).
//
// Usage:
//   node scripts/merge-all-limiteds.mjs
//   node scripts/merge-all-limiteds.mjs --base https://heximons.vercel.app
//   node scripts/merge-all-limiteds.mjs --start 4000   (resume from a specific id)
//
// It writes a checkpoint file (.sweep-checkpoint.json) after every
// chunk, so if it gets interrupted (Ctrl+C, network blip, etc.) just
// re-run the same command and it'll pick up where it left off.

import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const ITEMS_PATH = path.join(ROOT, "data", "items.json");
const CHECKPOINT_PATH = path.join(ROOT, ".sweep-checkpoint.json");

function parseArgs(argv) {
    const args = { base: "http://localhost:3000", start: null, delayMs: 500 };

    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === "--base") args.base = argv[++i];
        else if (argv[i] === "--start") args.start = Number(argv[++i]);
        else if (argv[i] === "--delay") args.delayMs = Number(argv[++i]);
    }

    return args;
}

async function loadJson(filePath, fallback) {
    try {
        const raw = await fs.readFile(filePath, "utf8");
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}

async function saveJson(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 4) + "\n", "utf8");
}

function mergeItems(existingItems, newItems) {
    const byId = new Map(existingItems.map(item => [item.id, item]));
    let added = 0;
    let updated = 0;

    for (const item of newItems) {
        if (byId.has(item.id)) {
            byId.set(item.id, { ...byId.get(item.id), ...item });
            updated++;
        }
        else {
            byId.set(item.id, item);
            added++;
        }
    }

    const merged = Array.from(byId.values()).sort((a, b) => a.id - b.id);
    return { merged, added, updated };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const args = parseArgs(process.argv.slice(2));

    const checkpoint = await loadJson(CHECKPOINT_PATH, { nextStart: 1, totalFound: 0 });
    let cursor = args.start ?? checkpoint.nextStart ?? 1;

    console.log(`Starting sweep at id ${cursor} against ${args.base}`);

    let totalFound = checkpoint.totalFound || 0;
    let totalAdded = 0;
    let totalUpdated = 0;
    let chunkCount = 0;

    while (true) {
        chunkCount++;
        const url = `${args.base}/api/sweep-limiteds?start=${cursor}`;
        console.log(`[chunk ${chunkCount}] GET ${url}`);

        let response;
        try {
            response = await fetch(url);
        }
        catch (error) {
            console.error(`Network error, will retry this chunk in 5s: ${error.message}`);
            await sleep(5000);
            continue;
        }

        if (!response.ok) {
            console.error(`Endpoint returned ${response.status}, retrying in 5s...`);
            await sleep(5000);
            continue;
        }

        const data = await response.json();

        if (data.failedBatches?.length) {
            console.warn(`  ${data.failedBatches.length} sub-batch(es) failed and were skipped this chunk.`);
        }

        if (data.items.length > 0) {
            const existingItems = await loadJson(ITEMS_PATH, []);
            const { merged, added, updated } = mergeItems(existingItems, data.items);
            await saveJson(ITEMS_PATH, merged);
            totalAdded += added;
            totalUpdated += updated;
            totalFound += data.items.length;
            console.log(`  found ${data.items.length} limited(s) in ids ${data.rangeChecked.start}-${data.rangeChecked.end} (+${added} new, ${updated} updated). items.json now has ${merged.length} total.`);
        }
        else {
            console.log(`  no limiteds in ids ${data.rangeChecked.start}-${data.rangeChecked.end}.`);
        }

        if (data.reachedEnd) {
            await fs.rm(CHECKPOINT_PATH, { force: true });
            console.log(`\nDone. Reached the end of the catalog at id ${data.rangeChecked.end}.`);
            console.log(`Totals this run: ${totalFound} limiteds found, ${totalAdded} added, ${totalUpdated} updated.`);
            break;
        }

        cursor = data.nextStart;
        await saveJson(CHECKPOINT_PATH, { nextStart: cursor, totalFound });
        await sleep(args.delayMs);
    }
}

main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});
