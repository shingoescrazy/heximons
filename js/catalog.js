// =========================
// HEXIMONS CATALOG SYSTEM
// =========================

window.catalogState = {
    page: 1,
    perPage: 24,
    sortDesc: true,
    search: "",
    filters: {
        types: new Set(),
        demand: new Set(),
        trend: new Set(),
        categories: new Set()
    },
    ranges: {
        valueMin: null,
        valueMax: null,
        rapMin: null,
        rapMax: null
    }
};

window.buildCatalog = function (items) {

    if (!Array.isArray(items)) {
        items = [];
    }

    window.allItems = items;
    window.catalogState.page = 1;

    renderCatalog();
};

// =========================
// CORE RENDER (filter + sort + paginate + draw)
// =========================

function renderCatalog() {

    const grid = document.getElementById("catalogGrid");
    const pager = document.getElementById("catalogPagination");

    if (!grid) {
        return;
    }

    const state = window.catalogState;
    const items = Array.isArray(window.allItems) ? window.allItems : [];

    // filter by search text
    let filtered = items.filter(item =>
        (item.name || "").toLowerCase().includes(state.search)
    );

    // filter by active facet pills (Item Types / Demand / Trend / Categories)
    filtered = filtered.filter(item => itemMatchesFilters(item));

    // filter by Value / RAP range inputs
    filtered = filtered.filter(item => itemMatchesRanges(item));

    // sort by value
    filtered = filtered.slice().sort((a, b) => {
        const av = Number(a.value || 0);
        const bv = Number(b.value || 0);
        return state.sortDesc ? bv - av : av - bv;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / state.perPage));

    if (state.page > totalPages) {
        state.page = totalPages;
    }

    const start = (state.page - 1) * state.perPage;
    const pageItems = filtered.slice(start, start + state.perPage);

    grid.innerHTML = "";

    if (pageItems.length === 0) {
        grid.innerHTML = `
            <div class="placeholder-card">
                No items match your search or filters.
            </div>
        `;
    }
    else {
        pageItems.forEach(item => {

            const card = document.createElement("div");
            card.className = "catalog-card";
            card.dataset.name = (item.name || "").toLowerCase();

            const value = Number(item.value || 0);
            const rap = Number(item.rap || 0);

            const price = item.bestPrice !== undefined && item.bestPrice !== null
                ? Number(item.bestPrice).toLocaleString()
                : "-";
            const available = item.availableCopies !== undefined && item.availableCopies !== null
                ? Number(item.availableCopies).toLocaleString()
                : "-";
            const premium = item.premiumCopies !== undefined && item.premiumCopies !== null
                ? Number(item.premiumCopies).toLocaleString()
                : "-";

            card.innerHTML = `
                <div class="catalog-name">${item.name || "Unknown Item"}</div>

                <div class="catalog-frame">
                    <img src="${item.image || ""}" alt="${item.name || "Item"}" loading="lazy">
                </div>

                <div class="catalog-diamond">&#9670;</div>

                <div class="catalog-stats">
                    <div><span>Price</span><b>${price}</b></div>
                    <div><span>RAP</span><b>${rap.toLocaleString()}</b></div>
                    <div><span>Value</span><b>${value.toLocaleString()}</b></div>
                    <div><span>Available</span><b>${available}</b></div>
                    <div><span>Premium</span><b>${premium}</b></div>
                </div>
            `;

            card.addEventListener("click", () => {
                if (typeof window.showItemPage === "function") {
                    window.showItemPage(item.id);
                }
            });

            grid.appendChild(card);
        });
    }

    renderPagination(totalPages);
}

// =========================
// PAGINATION CONTROLS
// =========================

function renderPagination(totalPages) {

    const pager = document.getElementById("catalogPagination");

    if (!pager) {
        return;
    }

    const state = window.catalogState;
    const current = state.page;

    let html = "";

    html += `<button ${current <= 1 ? "disabled" : ""} onclick="window.goToCatalogPage(${current - 1})">Prev</button>`;

    const pages = getPageList(current, totalPages);

    pages.forEach(p => {
        if (p === "...") {
            html += `<span class="ellipsis">...</span>`;
        }
        else {
            html += `<button class="${p === current ? "active" : ""}" onclick="window.goToCatalogPage(${p})">${p}</button>`;
        }
    });

    html += `<button ${current >= totalPages ? "disabled" : ""} onclick="window.goToCatalogPage(${current + 1})">Next</button>`;

    pager.innerHTML = html;
}

function getPageList(current, total) {

    const pages = [];

    if (total <= 7) {
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
        return pages;
    }

    pages.push(1);

    if (current > 3) {
        pages.push("...");
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (current < total - 2) {
        pages.push("...");
    }

    pages.push(total);

    return pages;
}

window.goToCatalogPage = function (page) {
    window.catalogState.page = page;
    renderCatalog();
    const grid = document.getElementById("catalogGrid");
    if (grid) {
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
};

// =========================
// SORT TOGGLE ("Highest Value")
// =========================

window.toggleValueSort = function () {

    const state = window.catalogState;
    state.sortDesc = !state.sortDesc;
    state.page = 1;

    const btn = document.getElementById("filterHighestValue");
    if (btn) {
        btn.textContent = state.sortDesc ? "Highest Value" : "Lowest Value";
    }

    renderCatalog();
};

// =========================
// FILTER PANEL OPEN / CLOSE
// =========================

window.toggleCatalogFilter = function (btn) {

    const key = btn.dataset.panel;

    if (!key) {
        btn.classList.toggle("active");
        return;
    }

    const panel = document.getElementById("panel-" + key);

    if (!panel) {
        return;
    }

    const isOpen = panel.classList.contains("open");

    // close every other panel first so only one is open at a time
    document.querySelectorAll(".filter-panel.open").forEach(p => {
        if (p !== panel) p.classList.remove("open");
    });
    document.querySelectorAll(".catalog-filter-btn[data-panel]").forEach(b => {
        if (b !== btn) updateFilterButtonState(b.dataset.panel);
    });

    if (isOpen) {
        panel.classList.remove("open");
    }
    else {
        panel.classList.add("open");
    }

    btn.classList.toggle("active", panel.classList.contains("open") || filterKeyHasActiveValues(key));
};

window.closeFilterPanel = function (key) {

    const panel = document.getElementById("panel-" + key);

    if (panel) {
        panel.classList.remove("open");
    }

    updateFilterButtonState(key);
};

// keeps a top filter button ("Item Types", "Demand", ...) highlighted
// whenever it has an active selection, even after its panel is closed
function updateFilterButtonState(key) {

    const btn = document.querySelector(
        '.catalog-filter-btn[data-panel="' + key + '"]'
    );

    if (!btn) {
        return;
    }

    const panel = document.getElementById("panel-" + key);
    const isOpen = !!panel && panel.classList.contains("open");

    btn.classList.toggle("active", isOpen || filterKeyHasActiveValues(key));
}

function filterKeyHasActiveValues(key) {

    const state = window.catalogState;

    if (key === "itemTypes") return state.filters.types.size > 0;
    if (key === "demand") return state.filters.demand.size > 0;
    if (key === "trend") return state.filters.trend.size > 0;
    if (key === "categories") return state.filters.categories.size > 0;
    if (key === "rangeFilters") {
        const r = state.ranges;
        return r.valueMin !== null || r.valueMax !== null || r.rapMin !== null || r.rapMax !== null;
    }
    return false;
}

// =========================
// FACET PILLS (Item Types / Demand / Trend / Categories)
// =========================

window.toggleFilterPill = function (btn) {

    const group = btn.dataset.group;
    const value = btn.dataset.value;

    if (!group || !value) {
        return;
    }

    const set = window.catalogState.filters[group];

    if (!set) {
        return;
    }

    btn.classList.toggle("active");

    if (set.has(value)) {
        set.delete(value);
    }
    else {
        set.add(value);
    }

    window.catalogState.page = 1;

    updateFilterButtonState(panelKeyForGroup(group));

    renderCatalog();
};

function panelKeyForGroup(group) {
    const map = {
        types: "itemTypes",
        demand: "demand",
        trend: "trend",
        categories: "categories"
    };
    return map[group] || group;
}

// =========================
// RANGE FILTERS (Value / RAP min & max)
// =========================

window.applyRangeFilter = function (input) {

    const key = input.dataset.range;

    if (!key) {
        return;
    }

    const raw = input.value.replace(/[^0-9.]/g, "");
    const num = raw === "" ? null : Number(raw);

    window.catalogState.ranges[key] = (num === null || isNaN(num)) ? null : num;
    window.catalogState.page = 1;

    updateFilterButtonState("rangeFilters");

    renderCatalog();
};

window.clearAllCatalogFilters = function () {

    const state = window.catalogState;

    state.filters.types.clear();
    state.filters.demand.clear();
    state.filters.trend.clear();
    state.filters.categories.clear();

    state.ranges.valueMin = null;
    state.ranges.valueMax = null;
    state.ranges.rapMin = null;
    state.ranges.rapMax = null;

    state.page = 1;

    document.querySelectorAll(".filter-pill.active").forEach(pill => pill.classList.remove("active"));
    document.querySelectorAll(".filter-range-inputs input").forEach(input => input.value = "");
    document.querySelectorAll(".catalog-filter-btn[data-panel]").forEach(btn => {
        updateFilterButtonState(btn.dataset.panel);
    });

    renderCatalog();
};

// =========================
// FILTER MATCHING
// =========================

function itemMatchesFilters(item) {

    const filters = window.catalogState.filters;

    if (filters.types.size > 0) {
        const anyMatch = [...filters.types].some(label => typeMatches(item, label));
        if (!anyMatch) return false;
    }

    if (filters.demand.size > 0) {
        const itemDemand = (item.demand || "Unassigned").toLowerCase();
        const anyMatch = [...filters.demand].some(v => v.toLowerCase() === itemDemand);
        if (!anyMatch) return false;
    }

    if (filters.trend.size > 0) {
        const itemTrend = (item.trend || "").toLowerCase();
        const anyMatch = [...filters.trend].some(v => v.toLowerCase() === itemTrend);
        if (!anyMatch) return false;
    }

    if (filters.categories.size > 0) {
        const anyMatch = [...filters.categories].some(key => categoryMatches(item, key));
        if (!anyMatch) return false;
    }

    return true;
}

function typeMatches(item, label) {
    const itemType = (item.type || "").toLowerCase();
    const normSingular = label.toLowerCase().replace(/s$/, "");
    return itemType === label.toLowerCase() || itemType === normSingular;
}

function categoryMatches(item, key) {
    switch (key) {
        case "onlyRares":
            return (item.rarity || "").toLowerCase() === "rare";
        case "onlyProjecteds":
            return !!item.projected;
        case "tablets":
            return !!item.tablet;
        case "unobtainables":
            return !!item.unobtainable;
        case "hoarded":
            return Number(item.hoardedCopies || 0) > 0;
        case "valued":
            return Number(item.value || 0) > 0;
        default:
            return true;
    }
}

function itemMatchesRanges(item) {

    const r = window.catalogState.ranges;
    const value = Number(item.value || 0);
    const rap = Number(item.rap || 0);

    if (r.valueMin !== null && value < r.valueMin) return false;
    if (r.valueMax !== null && value > r.valueMax) return false;
    if (r.rapMin !== null && rap < r.rapMin) return false;
    if (r.rapMax !== null && rap > r.rapMax) return false;

    return true;
}

// =========================
// CATALOG SEARCH (shared by navbar + catalog page search boxes)
// =========================

window.applyCatalogSearch = function (value, sourceId) {

    const v = (value || "").toString();

    const navInput = document.getElementById("searchBar");
    const catalogInput = document.getElementById("catalogSearchBar");

    if (sourceId !== "searchBar" && navInput) {
        navInput.value = v;
    }
    if (sourceId !== "catalogSearchBar" && catalogInput) {
        catalogInput.value = v;
    }

    window.catalogState.search = v.toLowerCase().trim();
    window.catalogState.page = 1;

    renderCatalog();
};

window.searchCatalog = function () {
    const navInput = document.getElementById("searchBar");
    window.applyCatalogSearch(navInput ? navInput.value : "", "searchBar");
};

document.addEventListener("DOMContentLoaded", () => {

    const catalogInput = document.getElementById("catalogSearchBar");

    if (catalogInput) {
        catalogInput.addEventListener("input", () => {
            window.applyCatalogSearch(catalogInput.value, "catalogSearchBar");
        });
    }
});

// =========================
// GET ITEM BY ID
// =========================

window.getItemById = function (id) {

    if (!window.allItems || !Array.isArray(window.allItems)) {
        return null;
    }

    return window.allItems.find(
        item => Number(item.id) === Number(id)
    ) || null;
};
