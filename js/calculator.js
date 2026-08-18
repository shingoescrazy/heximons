// =========================
// HEXIMONS TRADE CALCULATOR
// =========================

// Fixed-size slot arrays (4 slots per side, matching the 4 boxes in the UI).
// null = empty slot. This also fixes the "calculates indefinitely" bug,
// since there's now a hard cap of 4 items per side instead of an
// unbounded array that just kept growing forever.
window.offerItems = [null, null, null, null];
window.requestItems = [null, null, null, null];

// Which side newly-clicked items go into ("offer" or "request")
window.activeTradeSide = "offer";

// =========================
// BUILD ITEM SELECTOR
// =========================

window.buildCalculatorItems = function () {

    const container =
        document.getElementById(
            "calculatorItems"
        );

    if (!container) {
        return;
    }

    if (
        !window.allItems ||
        window.allItems.length === 0
    ) {

        container.innerHTML = `
            <div class="placeholder-card">
                No items loaded
            </div>
        `;

        return;
    }

    const limiteds = window.allItems;

    container.innerHTML = "";

    limiteds.forEach(item => {

        const card =
            document.createElement("div");

        card.className = "calc-item catalog-card";

        card.innerHTML = `

            <img
                class="calc-image"
                src="${item.image || ""}"
                alt="${item.name || "Item"}"
            >

            <b>${item.name || "Unknown Item"}</b>

            <p class="value-text">
                Value:
                ${Number(item.value || 0).toLocaleString()}
            </p>

            <p class="rap-text">
                RAP:
                ${Number(item.rap || 0).toLocaleString()}
            </p>

        `;

        // Clicking an item in the list fills the next empty box
        // on whichever side is currently selected (Offer/Request).
        card.addEventListener(
            "click",
            () => {
                addItemToSlots(window.activeTradeSide, item);
            }
        );

        container.appendChild(card);

    });

};

// =========================
// SLOT HELPERS
// =========================

function getSlotsArray(side) {
    return side === "offer" ? window.offerItems : window.requestItems;
}

function addItemToSlots(side, item) {

    const items = getSlotsArray(side);

    const emptyIndex = items.findIndex(slot => slot === null);

    if (emptyIndex === -1) {
        // All 4 boxes are full — ignore instead of growing forever.
        return;
    }

    items[emptyIndex] = item;

    renderSlots(side);

    if (typeof window.updateTradeCalculator === "function") {
        window.updateTradeCalculator();
    }
}

function clearSlot(side, index) {

    const items = getSlotsArray(side);

    items[index] = null;

    renderSlots(side);

    if (typeof window.updateTradeCalculator === "function") {
        window.updateTradeCalculator();
    }
}

// =========================
// RENDER SLOTS (the boxes)
// =========================

function renderSlots(side) {

    const items = getSlotsArray(side);

    const containerId = side === "offer" ? "offerSlots" : "requestSlots";
    const container = document.getElementById(containerId);

    if (!container) {
        return;
    }

    const slotEls = container.querySelectorAll(".trade-slot");

    slotEls.forEach((slotEl, index) => {

        const item = items[index];

        if (item) {

            slotEl.classList.add("filled");

            slotEl.innerHTML = `
                <img src="${item.image || ""}" alt="${item.name || "Item"}">
            `;

        } else {

            slotEl.classList.remove("filled");

            slotEl.textContent = "+";

        }

    });

}

// Click a filled box to remove that item (event delegation, set up once)
function setupSlotRemoval() {

    ["offerSlots", "requestSlots"].forEach(containerId => {

        const container = document.getElementById(containerId);

        if (!container) {
            return;
        }

        container.addEventListener("click", event => {

            const slotEl = event.target.closest(".trade-slot");

            if (!slotEl) {
                return;
            }

            const side = slotEl.dataset.side;
            const index = Number(slotEl.dataset.index);

            const items = getSlotsArray(side);

            if (items[index]) {
                clearSlot(side, index);
            }

        });

    });

}

// =========================
// OFFER / REQUEST TOGGLE
// =========================

function setupSideToggle() {

    const toggle = document.getElementById("sideToggle");

    if (!toggle) {
        return;
    }

    toggle.addEventListener("click", event => {

        const btn = event.target.closest(".side-btn");

        if (!btn) {
            return;
        }

        window.activeTradeSide = btn.dataset.side;

        toggle.querySelectorAll(".side-btn").forEach(b => {
            b.classList.remove("active");
        });

        btn.classList.add("active");

    });

}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        setupSlotRemoval();
        setupSideToggle();
    });
} else {
    setupSlotRemoval();
    setupSideToggle();
}
