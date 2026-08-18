// =========================
// HEXIMONS ITEM PAGE SYSTEM
// =========================

window.currentItem = null;
window.itemChartState = { chart: "history", range: "1y" };

// =========================
// HELPERS
// =========================

function fmt(n) {
    return Number(n || 0).toLocaleString();
}

function fmtPct(n) {
    return Number(n || 0).toFixed(1) + "%";
}

function demandClass(demand) {
    const map = {
        "High": "demand-high",
        "Decent": "demand-decent",
        "Low": "demand-low",
        "Terrible": "demand-terrible",
        "Unassigned": "demand-unassigned"
    };
    return map[demand] || "demand-unassigned";
}

function trendClass(trend) {
    const map = {
        "Raising": "trend-up",
        "Stable": "trend-stable",
        "Lowering": "trend-down",
        "Unstable": "trend-unstable",
        "Fluctuating": "trend-unstable"
    };
    return map[trend] || "trend-stable";
}

function trendArrow(trend) {
    if (trend === "Raising") return "&#8599;";
    if (trend === "Lowering") return "&#8600;";
    if (trend === "Unstable" || trend === "Fluctuating") return "&#8646;";
    return "&#8594;";
}

// =========================
// OPEN ITEM PAGE
// =========================

window.showItemPage = function (id) {

    if (!window.getItemById) {
        console.error("getItemById not loaded");
        return;
    }

    const item = window.getItemById(id);

    if (!item) {
        console.error("Item not found:", id);
        return;
    }

    window.currentItem = item;
    window.itemChartState = { chart: "history", range: "1y" };

    renderItemPage(item);

    if (window.showPage) {
        window.showPage("itemPage");
    }
};

// backwards-compatible alias
window.openItemPage = window.showItemPage;

// =========================
// CLOSE ITEM PAGE
// =========================

window.closeItemPage = function () {
    if (window.showPage) {
        window.showPage("catalog");
    }
};

// =========================
// MAIN RENDER
// =========================

function renderItemPage(item) {

    const details = document.getElementById("itemDetails");

    if (!details) {
        console.log("No item page found.");
        return;
    }

    const value = Number(item.value || 0);
    const rap = Number(item.rap || 0);
    const rapAfterSale = Number(item.rapAfterSale || rap);
    const bestPrice = Number(item.bestPrice || 0);
    const demand = item.demand || "Unassigned";
    const trend = item.trend || "Stable";
    const percentHoarded = Number(item.percentHoarded || 0);

    details.innerHTML = `

        <div class="item-hero">
            <div class="item-hero-top">
                <div class="item-hero-title">
                    <h1>${item.name || "Unknown Item"}
                        ${item.acronym ? `<span class="item-acronym">(${item.acronym})</span>` : ""}
                    </h1>
                    <span class="item-badge-rarity">
                        <span class="item-diamond">&#9670;</span>
                        ${item.rarity || "Item"}
                    </span>
                    ${item.robloxUrl ? `<a class="item-ext-link" href="${item.robloxUrl}" target="_blank" rel="noopener noreferrer" title="View on Roblox">&#8599;</a>` : ""}
                </div>
                <div class="item-hero-actions">
                    <button class="btn btn-small" onclick="window.showPage('tradeAds')">&#8644; Trade Ads</button>
                    <button class="btn btn-small" onclick="window.showPage('valueChanges')">&#128202; Sales</button>
                    <button class="btn btn-small" onclick="window.showPage('valueChanges')">&#128260; Value Changes</button>
                </div>
            </div>
            <div class="item-hero-sub">${item.category || "Roblox Item"}</div>
        </div>

        <div class="item-main-grid">

            <div class="item-image-card">
                <img src="${item.image || ""}" alt="${item.name || "Item"}">
            </div>

            <div class="item-tabs-card">

                <div class="item-tabs" id="itemTabBar">
                    <button class="item-tab active" data-tab="overview" onclick="window.setItemTab('overview')">Overview</button>
                    <button class="item-tab" data-tab="valuation" onclick="window.setItemTab('valuation')">Valuation</button>
                    <button class="item-tab" data-tab="moreinfo" onclick="window.setItemTab('moreinfo')">More Info</button>
                </div>

                <div class="item-tab-panel active" id="tab-overview">
                    <div class="item-info-grid">
                        <div class="item-info-col">
                            ${infoRow("&#128273;", "Type", item.type || "Item")}
                            ${infoRow("&#9678;", "Available Copies", fmt(item.availableCopies))}
                            ${infoRow("&#9679;", "Premium Copies", fmt(item.premiumCopies))}
                            ${infoRow("&#128200;", "Avg Daily Sales", Number(item.avgDailySales || 0).toFixed(2))}
                        </div>
                        <div class="item-info-col">
                            ${infoRow("&#127991;", "Acronym", item.acronym || "-")}
                            ${infoRow("&#128176;", "RAP After Sale", fmt(rapAfterSale))}
                            ${infoRow("&#128451;", "Hoarded", fmtPct(percentHoarded))}
                            ${infoRow(trendArrow(trend), "Trend", `<span class="${trendClass(trend)}">${trend}</span>`)}
                        </div>
                    </div>
                </div>

                <div class="item-tab-panel" id="tab-valuation">
                    <div class="item-info-grid">
                        <div class="item-info-col">
                            ${infoRow("&#128181;", "Value", fmt(value))}
                            ${infoRow("&#128202;", "RAP", fmt(rap))}
                            ${infoRow("&#128184;", "Best Price", fmt(bestPrice))}
                        </div>
                        <div class="item-info-col">
                            ${infoRow("&#128260;", "RAP After Sale", fmt(rapAfterSale))}
                            ${infoRow("&#128200;", "Demand", `<span class="${demandClass(demand)}">${demand}</span>`)}
                            ${infoRow(trendArrow(trend), "Trend", `<span class="${trendClass(trend)}">${trend}</span>`)}
                        </div>
                    </div>
                    <p class="item-tab-note">Value is a community-driven estimate of what this item reliably trades for, separate from RAP (recent average sale price) and the best current asking price.</p>
                </div>

                <div class="item-tab-panel" id="tab-moreinfo">
                    <div class="item-info-grid">
                        <div class="item-info-col">
                            ${infoRow("&#128100;", "Owners", fmt(item.owners))}
                            ${infoRow("&#11088;", "Premium Owners", fmt(item.premiumOwners))}
                            ${infoRow("&#128230;", "Total Copies", fmt(item.totalCopies))}
                        </div>
                        <div class="item-info-col">
                            ${infoRow("&#128465;", "Deleted Copies", fmt(item.deletedCopies))}
                            ${infoRow("&#128190;", "Hoarded Copies", fmt(item.hoardedCopies))}
                            ${infoRow("&#35;", "Item ID", fmt(item.id))}
                        </div>
                    </div>
                    ${item.robloxUrl ? `<p class="item-tab-note"><a class="link-btn" href="${item.robloxUrl}" target="_blank" rel="noopener noreferrer">View this item on the Roblox catalog &#8599;</a></p>` : ""}
                </div>

            </div>

        </div>

        <div class="item-stat-cards">
            <div class="item-stat-card">
                <span class="isc-icon">&#128308;</span>
                <div><span>Best Price</span><b>${fmt(bestPrice)}</b></div>
            </div>
            <div class="item-stat-card">
                <span class="isc-icon">&#128202;</span>
                <div><span>RAP</span><b>${fmt(rap)}</b></div>
            </div>
            <div class="item-stat-card">
                <span class="isc-icon">&#128200;</span>
                <div><span>Value</span><b>${fmt(value)}</b></div>
            </div>
            <div class="item-stat-card">
                <span class="isc-icon">&#128101;</span>
                <div><span>Demand</span><b class="${demandClass(demand)}">${demand}</b></div>
            </div>
        </div>

        <div class="item-charts-card">

            <h2 class="item-section-title">Charts</h2>

            <div class="chart-tabs" id="chartTabBar">
                <button class="chart-tab active" data-chart="history" onclick="window.setChartTab('history')">History</button>
                <button class="chart-tab" data-chart="value" onclick="window.setChartTab('value')">Value</button>
                <button class="chart-tab" data-chart="copies" onclick="window.setChartTab('copies')">Copies</button>
                <button class="chart-tab" data-chart="ownership" onclick="window.setChartTab('ownership')">Ownership</button>
                <button class="chart-tab" data-chart="hoarding" onclick="window.setChartTab('hoarding')">Hoarding</button>
            </div>

            <div class="chart-controls">
                <div class="chart-ranges" id="chartRangeBar">
                    ${["1d","3d","1w","1m","3m","6m","1y","All"].map(r =>
                        `<button class="range-btn ${r === "1y" ? "active" : ""}" data-range="${r}" onclick="window.setChartRange('${r}')">${r}</button>`
                    ).join("")}
                </div>
                <div class="chart-dates" id="chartDateLabel">Jul 12, 2025 &#8594; Jul 12, 2026</div>
            </div>

            <div class="chart-area" id="itemChartArea"></div>

            <div class="chart-legend" id="chartLegend"></div>

        </div>

        <div class="item-ownership-card">

            <h2 class="item-section-title">Ownership</h2>

            <div class="ownership-grid">
                <div class="ownership-stat"><span>Total Copies</span><b>${fmt(item.totalCopies)}</b></div>
                <div class="ownership-stat"><span>Available Copies</span><b>${fmt(item.availableCopies)}</b></div>
                <div class="ownership-stat"><span>Premium Copies</span><b>${fmt(item.premiumCopies)}</b></div>
                <div class="ownership-stat"><span>Deleted Copies</span><b>${fmt(item.deletedCopies)}</b></div>
                <div class="ownership-stat accent"><span>Owners</span><b>${fmt(item.owners)}</b></div>
                <div class="ownership-stat accent"><span>Premium Owners</span><b>${fmt(item.premiumOwners)}</b></div>
                <div class="ownership-stat accent"><span>Hoarded Copies</span><b>${fmt(item.hoardedCopies)}</b></div>
                <div class="ownership-stat accent"><span>Percent Hoarded</span><b>${fmtPct(percentHoarded)}</b></div>
            </div>

        </div>

        <div class="owner-lists-section" id="ownerListsSection">
            ${renderOwnerListsSection(item)}
        </div>

        <div class="more-items-section" id="moreItemsSection">
            ${renderMoreItemsSection(item)}
        </div>

        <button class="btn btn-ghost item-back-btn" onclick="window.closeItemPage()">&#8592; Back To Catalog</button>

    `;

    renderItemChart();
}

function infoRow(icon, label, value) {
    return `
        <div class="item-info-row">
            <span class="ii-icon">${icon}</span>
            <div>
                <label>${label}</label>
                <b>${value}</b>
            </div>
        </div>
    `;
}

// =========================
// TAB SWITCHING (Overview / Valuation / More Info)
// =========================

window.setItemTab = function (tab) {

    document.querySelectorAll("#itemTabBar .item-tab").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tab);
    });

    document.querySelectorAll(".item-tab-panel").forEach(panel => {
        panel.classList.toggle("active", panel.id === "tab-" + tab);
    });
};

// =========================
// CHART TAB SWITCHING
// =========================

window.setChartTab = function (chart) {

    window.itemChartState.chart = chart;

    document.querySelectorAll("#chartTabBar .chart-tab").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.chart === chart);
    });

    renderItemChart();
};

window.setChartRange = function (range) {

    window.itemChartState.range = range;

    document.querySelectorAll("#chartRangeBar .range-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.range === range);
    });

    renderItemChart();
};

// =========================
// CHART RENDERING (deterministic procedural SVG line chart)
// =========================

function seededRandom(seed) {
    let t = seed += 0x6D2B79F5;
    return function () {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function buildSeries(item, chart) {

    const points = 26;
    const idSeed = Number(item.id || 1) * 97 + chart.length * 13;
    const rand = seededRandom(idSeed);

    let base;
    let driftPerStep;

    if (chart === "history" || chart === "value") {
        base = Number(item.value || item.rap || 1000);
    } else if (chart === "copies") {
        base = Number(item.totalCopies || 20);
    } else if (chart === "ownership") {
        base = Number(item.owners || 10);
    } else {
        base = Number(item.hoardedCopies || 1) + 1;
    }

    const trend = item.trend || "Stable";

    if (trend === "Raising") driftPerStep = 0.012;
    else if (trend === "Lowering") driftPerStep = -0.012;
    else if (trend === "Fluctuating" || trend === "Unstable") driftPerStep = 0;
    else driftPerStep = -0.002;

    const series = [];
    let v = base * 1.08;

    for (let i = 0; i < points; i++) {
        const noise = (rand() - 0.5) * (trend === "Fluctuating" ? 0.09 : 0.025);
        v = v * (1 + driftPerStep + noise);
        if (v < base * 0.15) v = base * 0.15;
        series.push(v);
    }

    // settle the final value near the current stat so the line ends "now"
    series[series.length - 1] = base;

    return series;
}

function renderItemChart() {

    const area = document.getElementById("itemChartArea");
    const legend = document.getElementById("chartLegend");

    if (!area || !window.currentItem) {
        return;
    }

    const item = window.currentItem;
    const chart = window.itemChartState.chart;
    const series = buildSeries(item, chart);

    const width = 900;
    const height = 300;
    const padL = 46;
    const padR = 20;
    const padT = 20;
    const padB = 34;

    const max = Math.max(...series);
    const min = Math.min(...series);
    const range = (max - min) || 1;

    const stepX = (width - padL - padR) / (series.length - 1);

    const pointsCoords = series.map((v, i) => {
        const x = padL + i * stepX;
        const y = padT + (1 - (v - min) / range) * (height - padT - padB);
        return [x, y];
    });

    const linePath = pointsCoords.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    const areaPath = linePath +
        ` L${pointsCoords[pointsCoords.length - 1][0].toFixed(1)},${(height - padB).toFixed(1)}` +
        ` L${pointsCoords[0][0].toFixed(1)},${(height - padB).toFixed(1)} Z`;

    const colorMap = {
        history: "var(--green)",
        value: "var(--accent)",
        copies: "var(--yellow)",
        ownership: "var(--accent)",
        hoarding: "var(--red)"
    };
    const lineColor = colorMap[chart] || "var(--green)";

    // gridlines
    let gridLines = "";
    for (let i = 0; i <= 4; i++) {
        const y = padT + (i / 4) * (height - padT - padB);
        gridLines += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" class="chart-grid-line" />`;
    }

    // month labels
    const months = ["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"];
    let labels = "";
    const labelStep = Math.floor(pointsCoords.length / (months.length - 1));
    months.forEach((m, i) => {
        const idx = Math.min(i * labelStep, pointsCoords.length - 1);
        const x = pointsCoords[idx][0];
        labels += `<text x="${x.toFixed(1)}" y="${height - 10}" class="chart-axis-label">${m}</text>`;
    });

    // sale marker (red tick) near the end for the "history" chart, echoing the screenshot
    let saleMarker = "";
    if (chart === "history" && Number(item.avgDailySales) >= 0) {
        const mx = pointsCoords[pointsCoords.length - 3][0];
        saleMarker = `<line x1="${mx}" y1="${padT + 10}" x2="${mx}" y2="${height - padB}" class="chart-sale-marker" />`;
    }

    area.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" class="item-chart-svg" preserveAspectRatio="none">
            ${gridLines}
            <path d="${areaPath}" class="chart-fill" style="fill:${lineColor}" />
            <path d="${linePath}" class="chart-line" style="stroke:${lineColor}" />
            ${saleMarker}
            ${labels}
        </svg>
    `;

    if (legend) {
        const legendMap = {
            history: [["Avg Daily Sales Price", "var(--green)"], ["Sales Volume", "var(--red)"]],
            value: [["Value", "var(--accent)"]],
            copies: [["Total Copies", "var(--yellow)"]],
            ownership: [["Owners", "var(--accent)"]],
            hoarding: [["Hoarded Copies", "var(--red)"]]
        };
        const extras = [["RAP", "var(--text-dim)"], ["Best Price", "var(--text-dim)"], ["Sellers", "var(--text-dim)"], ["Favorites", "var(--text-dim)"]];
        const items = (legendMap[chart] || []).concat(chart === "history" ? extras : []);

        legend.innerHTML = items.map(([label, color]) =>
            `<span class="legend-item"><i style="background:${color}"></i>${label}</span>`
        ).join("");
    }
}

// =========================
// OWNER LISTS (demo data, deterministic per item)
// =========================

window.itemOwnerState = { tab: "premium", page: 1, perPage: 8 };

const OWNER_NAME_POOL = [
    "SonOfSeverless", "leaf10p", "blazies", "rip_indra", "zlib", "EarlGrey", "Stickmasterluke", "Roblox",
    "xX_Trader_Xx", "Voidwalker22", "PixelPhantom", "NightOwlz", "QuartzKid", "BuilderBenny", "Frostbyte",
    "IronGolem99", "MysticRay", "TinyTitan", "ShadowFax", "LunarWolf", "CrimsonEcho", "GlassCannon",
    "SkyPirateX", "VelvetHex", "OreoBandit", "JollyRogerz", "NovaSprint", "RustyAnchor", "PineconeJoe",
    "ZenithZero", "EmberFall", "GoldenTusk", "WispWander", "ClayGolem", "ThunderPug", "SilentSiren"
];

function seedFromString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
    }
    return h || 1;
}

function randomAgoLabel(rand) {
    const r = rand();
    if (r < 0.12) return `${Math.floor(rand() * 50) + 1} minutes ago`;
    if (r < 0.32) return `${Math.floor(rand() * 23) + 1} hours ago`;
    if (r < 0.58) return `${Math.floor(rand() * 29) + 1} days ago`;
    if (r < 0.8) return `${Math.floor(rand() * 11) + 1} months ago`;
    return `${Math.floor(rand() * 15) + 1} years ago`;
}

function generateOwnerList(item) {

    const totalOwners = Math.max(Number(item.owners || 0), 1);
    const premiumOwners = Math.min(Number(item.premiumOwners || 0), totalOwners);
    const totalCopies = Math.max(Number(item.totalCopies || totalOwners), totalOwners);
    const hoardedCopies = Number(item.hoardedCopies || 0);

    const count = Math.min(totalOwners, 40);
    const rand = seededRandom(seedFromString("owners-" + item.id));

    const usedSerials = new Set();
    const owners = [];

    for (let i = 0; i < count; i++) {

        const name = OWNER_NAME_POOL[Math.floor(rand() * OWNER_NAME_POOL.length)];

        let serial = Math.floor(rand() * totalCopies);
        let attempts = 0;
        while (usedSerials.has(serial) && attempts < 10) {
            serial = Math.floor(rand() * totalCopies);
            attempts++;
        }
        usedSerials.add(serial);

        const isPremium = i < premiumOwners;
        const hoardChance = Math.min((hoardedCopies / Math.max(totalCopies, 1)) * 1.5, 0.9);
        const isHoarder = rand() < hoardChance;

        owners.push({
            player: name,
            serial: serial,
            lastOnline: randomAgoLabel(rand),
            ownedSince: randomAgoLabel(rand),
            uaid: 180000000 + Math.floor(rand() * 9999999),
            premium: isPremium,
            hoarder: isHoarder
        });
    }

    owners.sort((a, b) => a.serial - b.serial);

    return owners;
}

function ownerRows(list) {

    if (!list.length) {
        return `<tr><td colspan="6" class="owner-empty">No owners found for this filter.</td></tr>`;
    }

    return list.map(o => `
        <tr>
            <td>
                <div class="owner-player">
                    <span class="owner-avatar">${o.player.charAt(0).toUpperCase()}</span>
                    <span class="owner-name">${o.player}${o.premium ? ` <span class="owner-premium-mark" title="Premium">&#9679;</span>` : ""}</span>
                </div>
            </td>
            <td class="owner-mono">${fmt(o.serial)}</td>
            <td>${o.lastOnline}</td>
            <td>${o.ownedSince}</td>
            <td class="owner-mono">${o.uaid}</td>
            <td><button class="btn btn-small owner-trade-btn" onclick="window.demoOwnerTrade('${o.player}')">Trade</button></td>
        </tr>
    `).join("");
}

function renderOwnerListsSection(item) {

    const all = generateOwnerList(item);
    const state = window.itemOwnerState;

    let filtered = all;
    if (state.tab === "premium") filtered = all.filter(o => o.premium);
    else if (state.tab === "hoards") filtered = all.filter(o => o.hoarder);

    const perPage = state.perPage;
    const totalPages = Math.max(Math.ceil(filtered.length / perPage), 1);
    state.page = Math.min(Math.max(state.page, 1), totalPages);
    const start = (state.page - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);

    return `
        <div class="owner-lists-card">
            <div class="owner-lists-head">
                <div class="owner-tabs" id="ownerTabBar">
                    <button class="owner-tab ${state.tab === "premium" ? "active" : ""}" data-tab="premium" onclick="window.setOwnerTab('premium')">Premium Copies</button>
                    <button class="owner-tab ${state.tab === "all" ? "active" : ""}" data-tab="all" onclick="window.setOwnerTab('all')">All Copies</button>
                    <button class="owner-tab ${state.tab === "hoards" ? "active" : ""}" data-tab="hoards" onclick="window.setOwnerTab('hoards')">Hoards</button>
                </div>
                <h2 class="item-section-title owner-lists-title">Owner Lists</h2>
            </div>

            <div class="owner-table-wrap">
                <table class="owner-table">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Serial</th>
                            <th>Last Online</th>
                            <th>Owned Since</th>
                            <th>UAID</th>
                            <th>Trading</th>
                        </tr>
                    </thead>
                    <tbody id="ownerTableBody">
                        ${ownerRows(pageItems)}
                    </tbody>
                </table>
            </div>

            <div class="owner-list-footer">
                <span class="owner-count">Showing ${filtered.length === 0 ? 0 : start + 1} to ${Math.min(start + perPage, filtered.length)} of ${filtered.length} entries</span>
                <div class="owner-pagination">
                    <button class="btn btn-small owner-page-btn" ${state.page <= 1 ? "disabled" : ""} onclick="window.setOwnerPage(${state.page - 1})">Prev</button>
                    <span class="owner-page-current">${state.page}</span>
                    <button class="btn btn-small owner-page-btn" ${state.page >= totalPages ? "disabled" : ""} onclick="window.setOwnerPage(${state.page + 1})">Next</button>
                </div>
            </div>
        </div>
    `;
}

function refreshOwnerListsSection() {
    const container = document.getElementById("ownerListsSection");
    if (!container || !window.currentItem) return;
    container.innerHTML = renderOwnerListsSection(window.currentItem);
}

window.setOwnerTab = function (tab) {
    window.itemOwnerState.tab = tab;
    window.itemOwnerState.page = 1;
    refreshOwnerListsSection();
};

window.setOwnerPage = function (page) {
    window.itemOwnerState.page = Math.max(1, page);
    refreshOwnerListsSection();
};

window.demoOwnerTrade = function (name) {
    if (typeof showToast === "function") {
        showToast(`Trade request sent to ${name} (demo only — no backend)`);
    }
};

// =========================
// MORE ROBLOX ITEMS
// =========================

function renderMoreItemsSection(item) {

    const all = Array.isArray(window.allItems) ? window.allItems : [];
    const others = all.filter(i => String(i.id) !== String(item.id));

    if (!others.length) {
        return "";
    }

    const cards = others.map(i => `
        <div class="item-card more-item-card" onclick="window.showItemPage('${i.id}')">
            <div class="item-frame">
                <img src="${i.image || ""}" alt="${i.name || "Item"}">
            </div>
            <div class="item-name">${i.name || "Unknown Item"}</div>
            <div class="item-stat">By <b>${i.category === "Roblox Limited" || i.category === "Roblox Item" ? "Roblox" : (item.creator || "Roblox")}</b></div>
            <div class="item-stat">Price <b>${fmt(i.bestPrice || i.value || i.rap || 0)}</b></div>
        </div>
    `).join("");

    return `
        <h2 class="item-section-title">More Roblox Items</h2>
        <div class="item-row more-items-row">
            ${cards}
        </div>
    `;
}
