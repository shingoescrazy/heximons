// =========================
// HEXIMONS APP STARTUP
// =========================

window.allItems = [];

// =========================
// LOAD ITEMS.JSON
// =========================

async function loadItems() {

    try {

        const response = await fetch("./data/items.json");

        if (!response.ok) {
            throw new Error(
                `Failed to load items.json (${response.status})`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "items.json must contain an array"
            );
        }

        window.allItems = data;

        console.log(
            `Loaded ${window.allItems.length} items`
        );

        window.dispatchEvent(
            new Event("itemsLoaded")
        );

        refreshWebsite();

    }
    catch (error) {

        console.error(
            "Item loading error:",
            error
        );

        const catalog =
            document.getElementById("catalogGrid");

        if (catalog) {
            catalog.innerHTML = `
                <div class="placeholder-card">
                    Failed to load items.json
                </div>
            `;
        }

        const calculator =
            document.getElementById("calculatorItems");

        if (calculator) {
            calculator.innerHTML = `
                <div class="placeholder-card">
                    Failed to load items.json
                </div>
            `;
        }
    }
}

// =========================
// REFRESH WEBSITE
// =========================

function refreshWebsite() {

    if (
        typeof window.buildCatalog === "function"
    ) {
        window.buildCatalog(
            window.allItems
        );
    }

    if (
        typeof window.buildCalculatorItems === "function"
    ) {
        window.buildCalculatorItems();
    }

    if (
        typeof window.loadLimiteds === "function"
    ) {
        window.loadLimiteds();
    }
}

// =========================
// START WEBSITE
// =========================

document.addEventListener(
    "DOMContentLoaded",
    loadItems
);