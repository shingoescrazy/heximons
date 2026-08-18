// =========================
// HEXIMONS DEALS PAGE
// =========================

window.dealsState = {
    sortBy: "recent",
    hideBelow: 10,
    hideMode: "preset",     // "preset" | "custom"
    projections: "show",
    calc: "value",
    colorCodesOpen: false,
    openDropdown: null
};

const SORT_LABELS = {
    recent: "Most Recent",
    lowestPrice: "Lowest Price",
    bestDeal: "Best Deal",
    highestValue: "Highest Value",
    lowestValue: "Lowest Value",
    highestRap: "Highest RAP",
    lowestRap: "Lowest RAP"
};

const HIDE_PRESETS = [10, 20, 30, 40, 50];

// =========================
// DEAL MATH
// =========================

function computeDealPercent(item, calc) {
    const base = Number(calc === "rap" ? item.rap : item.value) || 0;
    const bestPrice = Number(item.bestPrice) || 0;
    if (base <= 0 || bestPrice <= 0) return null;
    return ((base - bestPrice) / base) * 100;
}

function dealTier(pct) {
    if (pct >= 50) return { cls: "tier-gold", label: "Gold Deal" };
    if (pct >= 40) return { cls: "tier-purple", label: "Purple Deal" };
    if (pct >= 30) return { cls: "tier-blue", label: "Blue Deal" };
    return { cls: "tier-green", label: "Green Deal" };
}

function getFilteredDeals() {

    const items = Array.isArray(window.allItems) ? window.allItems : [];
    const state = window.dealsState;

    let deals = items.map(item => {
        const pct = computeDealPercent(item, state.calc);
        return { item, pct };
    }).filter(d => d.pct !== null);

    deals = deals.filter(d => d.pct >= Number(state.hideBelow));

    if (state.projections === "hide") {
        deals = deals.filter(d => !d.item.projected);
    }

    deals.sort((a, b) => {
        switch (state.sortBy) {
            case "lowestPrice":
                return Number(a.item.bestPrice || 0) - Number(b.item.bestPrice || 0);
            case "bestDeal":
                return b.pct - a.pct;
            case "highestValue":
                return Number(b.item.value || 0) - Number(a.item.value || 0);
            case "lowestValue":
                return Number(a.item.value || 0) - Number(b.item.value || 0);
            case "highestRap":
                return Number(b.item.rap || 0) - Number(a.item.rap || 0);
            case "lowestRap":
                return Number(a.item.rap || 0) - Number(b.item.rap || 0);
            case "recent":
            default:
                return Number(b.item.id || 0) - Number(a.item.id || 0);
        }
    });

    return deals;
}

// =========================
// RENDER
// =========================

window.buildDeals = function () {

    const grid = document.getElementById("dealsGrid");

    if (!grid) {
        return;
    }

    const state = window.dealsState;

    grid.innerHTML = `

        <div class="deals-toolbar">

            <div class="deals-toolbar-top">
                <button class="btn btn-small deals-colorcodes-btn" onclick="window.toggleColorCodes()">Color Codes</button>
                <div class="deals-monitor">
                    <span class="deals-monitor-dot"></span>
                    Monitoring deals
                </div>
            </div>

            <div class="deals-color-legend" id="dealsColorLegend" style="display:${state.colorCodesOpen ? "flex" : "none"}">
                <span class="legend-chip tier-green">&#9679; 0&ndash;30%</span>
                <span class="legend-chip tier-blue">&#9679; 30&ndash;40%</span>
                <span class="legend-chip tier-purple">&#9679; 40&ndash;50%</span>
                <span class="legend-chip tier-gold">&#9679; 50%+</span>
            </div>

            <div class="deals-toolbar-controls">

                <div class="deals-control">
                    <label>Sort By</label>
                    <div class="deals-dropdown">
                        <button class="deals-dropdown-btn" onclick="window.toggleDealsDropdown('sort')">
                            <span>${SORT_LABELS[state.sortBy]}</span>
                            <span class="dd-arrow">&#9662;</span>
                        </button>
                        <div class="deals-dropdown-menu" id="dealsSortMenu" style="display:${state.openDropdown === "sort" ? "block" : "none"}">
                            ${Object.keys(SORT_LABELS).map(key => `
                                <button class="${state.sortBy === key ? "active" : ""}" onclick="window.setDealsSort('${key}')">${SORT_LABELS[key]}</button>
                            `).join("")}
                        </div>
                    </div>
                </div>

                <div class="deals-control">
                    <label>Hide Deals Below</label>
                    <div class="deals-dropdown">
                        ${state.hideMode === "custom" ? `
                            <div class="deals-custom-group">
                                <button class="deals-dropdown-btn deals-custom-label" onclick="window.toggleDealsDropdown('hide')">
                                    <span>Custom %</span>
                                    <span class="dd-arrow">&#9662;</span>
                                </button>
                                <input
                                    type="number"
                                    class="deals-custom-input"
                                    id="dealsCustomInput"
                                    min="0" max="100" step="1"
                                    value="${state.hideBelow}"
                                    oninput="window.updateDealsCustomHideBelow(this.value)"
                                    onclick="event.stopPropagation()"
                                >
                            </div>
                        ` : `
                            <button class="deals-dropdown-btn" onclick="window.toggleDealsDropdown('hide')">
                                <span>${state.hideBelow}%</span>
                                <span class="dd-arrow">&#9662;</span>
                            </button>
                        `}
                        <div class="deals-dropdown-menu" id="dealsHideMenu" style="display:${state.openDropdown === "hide" ? "block" : "none"}">
                            ${HIDE_PRESETS.map(pct => `
                                <button class="${state.hideMode === "preset" && state.hideBelow === pct ? "active" : ""}" onclick="window.selectDealsHidePreset(${pct})">${pct}%</button>
                            `).join("")}
                            <button class="deals-dropdown-custom ${state.hideMode === "custom" ? "active" : ""}" onclick="window.selectDealsHideCustom()">Custom %&hellip;</button>
                        </div>
                    </div>
                </div>

                <div class="deals-control">
                    <label>Known Projections</label>
                    <div class="deals-toggle-group">
                        <button class="deals-toggle-btn ${state.projections === "hide" ? "active" : ""}" onclick="window.setDealsProjections('hide')">Hide</button>
                        <button class="deals-toggle-btn ${state.projections === "show" ? "active" : ""}" onclick="window.setDealsProjections('show')">Show</button>
                    </div>
                </div>

                <div class="deals-control">
                    <label>Deal Calculation</label>
                    <div class="deals-toggle-group">
                        <button class="deals-toggle-btn ${state.calc === "rap" ? "active" : ""}" onclick="window.setDealsCalc('rap')">RAP</button>
                        <button class="deals-toggle-btn ${state.calc === "value" ? "active" : ""}" onclick="window.setDealsCalc('value')">Value</button>
                    </div>
                </div>

            </div>

        </div>

        <div class="deals-results-grid" id="dealsResultsGrid">
            ${renderDealsResults()}
        </div>

    `;

};

function renderDealsResults() {

    const deals = getFilteredDeals();

    if (!Array.isArray(window.allItems) || window.allItems.length === 0) {
        return `
            <div class="placeholder-card">
                <h3>Loading deals&hellip;</h3>
                <p>Scanning the catalog for undervalued limiteds and trading opportunities.</p>
            </div>
        `;
    }

    if (deals.length === 0) {
        return `
            <div class="placeholder-card">
                <h3>No deals match your filters</h3>
                <p>Try lowering the "Hide Deals Below" threshold or switching the deal calculation basis.</p>
            </div>
        `;
    }

    return deals.map(({ item, pct }) => {

        const tier = dealTier(pct);
        const calcBase = window.dealsState.calc === "rap" ? item.rap : item.value;
        const calcLabel = window.dealsState.calc === "rap" ? "RAP" : "Value";
        const bestPrice = Number(item.bestPrice || 0);

        return `
            <div class="deal-card2 ${tier.cls}" onclick="window.showItemPage && window.showItemPage(${item.id})">
                <div class="dc2-header">${item.name || "Unknown Item"}</div>
                <div class="dc2-body" style="background-image:url('${item.image || ""}')">
                    <div class="dc2-overlay"></div>
                    <div class="dc2-stats">
                        <div class="dc2-row">
                            <span class="dc2-label">Price</span>
                            <span class="dc2-value">${bestPrice.toLocaleString()}</span>
                        </div>
                        <div class="dc2-row">
                            <span class="dc2-label">${calcLabel}</span>
                            <span class="dc2-value">${Number(calcBase || 0).toLocaleString()}</span>
                        </div>
                        <div class="dc2-row dc2-deal-row">
                            <span class="dc2-label">Deal</span>
                            <span class="dc2-value dc2-deal-value">${pct.toFixed(0)}%</span>
                        </div>
                        ${item.projected ? `<div class="dc2-projected">&#9888; Projected</div>` : ""}
                    </div>
                </div>
            </div>
        `;

    }).join("");
}

function refreshDealsResults() {
    const results = document.getElementById("dealsResultsGrid");
    if (results) {
        results.innerHTML = renderDealsResults();
    }
}

// =========================
// CONTROLS
// =========================

window.toggleColorCodes = function () {
    window.dealsState.colorCodesOpen = !window.dealsState.colorCodesOpen;
    window.buildDeals();
};

window.toggleDealsDropdown = function (name) {
    window.dealsState.openDropdown =
        window.dealsState.openDropdown === name ? null : name;
    window.buildDeals();
};

window.setDealsSort = function (key) {
    window.dealsState.sortBy = key;
    window.dealsState.openDropdown = null;
    window.buildDeals();
};

window.selectDealsHidePreset = function (pct) {
    window.dealsState.hideMode = "preset";
    window.dealsState.hideBelow = pct;
    window.dealsState.openDropdown = null;
    window.buildDeals();
};

window.selectDealsHideCustom = function () {
    window.dealsState.hideMode = "custom";
    window.dealsState.openDropdown = null;
    window.buildDeals();

    // focus + select the new input once it's in the DOM
    setTimeout(() => {
        const input = document.getElementById("dealsCustomInput");
        if (input) {
            input.focus();
            input.select();
        }
    }, 0);
};

window.updateDealsCustomHideBelow = function (value) {
    const num = Math.min(Math.max(Number(value) || 0, 0), 100);
    window.dealsState.hideBelow = num;
    // only refresh the results grid so the input never loses focus while typing
    refreshDealsResults();
};

window.setDealsProjections = function (val) {
    window.dealsState.projections = val;
    refreshDealsResults();
};

window.setDealsCalc = function (val) {
    window.dealsState.calc = val;
    window.buildDeals();
};

// close open dropdowns when clicking outside of them
document.addEventListener("click", event => {
    if (!window.dealsState.openDropdown) return;
    if (event.target.closest(".deals-dropdown")) return;
    window.dealsState.openDropdown = null;
    window.buildDeals();
});

// =========================
// INITIALIZE
// =========================

document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.buildDeals === "function") {
        window.buildDeals();
    }
});

window.addEventListener("itemsLoaded", () => {
    if (typeof window.buildDeals === "function") {
        window.buildDeals();
    }
});
