// =========================
// HEXIMONS TRADE ADS
// =========================


window.tradeAdsState = {
    ads: [],
    page: 1,
    perPage: 5,
    offerSortAsc: false,
    requestSortAsc: false,
    offerFilterText: "",
    requestFilterText: "",
    requestAnyOnly: false
};

// =========================
// TRADE HELPERS
// =========================

function sumField(list, field) {

    if (!list || list.length === 0) return 0;

    if (list[0] === "ANY") return null;

    return list.reduce((total, item) => {
        return total + Number(item[field] || 0);
    }, 0);
}


function timeAgoLabel(minutes) {

    if (!minutes || minutes < 1) {
        return "just now";
    }

    if (minutes === 1) {
        return "1 minute ago";
    }

    if (minutes < 60) {
        return `${minutes} minutes ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours === 1) {
        return "1 hour ago";
    }

    if (hours < 24) {
        return `${hours} hours ago`;
    }

    const days = Math.floor(hours / 24);

    if (days === 1) {
        return "1 day ago";
    }

    return `${days} days ago`;
}

// =========================
// RENDER AD LIST
// =========================

function getFilteredSortedAds() {

    let ads = window.tradeAdsState.ads.slice();

    const offerText = window.tradeAdsState.offerFilterText.toLowerCase().trim();
    const requestText = window.tradeAdsState.requestFilterText.toLowerCase().trim();

    if (offerText) {
        ads = ads.filter(ad =>
            ad.offering.some(item =>
                item !== "ANY" && (item.name || "").toLowerCase().includes(offerText)
            )
        );
    }

    if (requestText) {
        ads = ads.filter(ad =>
            ad.requesting.some(item =>
                item !== "ANY" && (item.name || "").toLowerCase().includes(requestText)
            )
        );
    }

    if (window.tradeAdsState.requestAnyOnly) {
        ads = ads.filter(ad => ad.requesting[0] === "ANY");
    }

    ads.sort((a, b) => {

        const aOfferValue = sumField(a.offering, "value") || 0;
        const bOfferValue = sumField(b.offering, "value") || 0;

        const diff = window.tradeAdsState.offerSortAsc
            ? aOfferValue - bOfferValue
            : bOfferValue - aOfferValue;

        return diff;
    });

    return ads;
}



        
function buildAdSlotHtml(items) {

    let html = "";

    for (let i = 0; i < 4; i++) {

        const item = items[i];

        if (item === "ANY") {

            html += `
                <div class="ad-slot any">
                    ANY
                </div>
            `;

        } else if (item) {

            html += `
                <div class="ad-slot">
                    <img
                        src="${item.image || ""}"
                        alt="${item.name || "Item"}"
                    >
                </div>
            `;

        } else {

            html += `
                <div class="ad-slot empty"></div>
            `;
        }
    }

    return html;
}
function buildAdCardHtml(ad) {

    const offerValue = sumField(ad.offering, "value");
    const offerRap = sumField(ad.offering, "rap");

    const requestValue = sumField(ad.requesting, "value");
    const requestRap = sumField(ad.requesting, "rap");

    const initials =
        (ad.username || "?")
        .charAt(0)
        .toUpperCase();

    return `

        <div class="trade-card">

            <div class="trade-header">

                <div class="trade-user">

                    <div class="trade-avatar">
                        ${initials}
                    </div>

                    <div>

                        <div class="trade-username">
                            ${ad.username}
                        </div>

                        <div class="trade-time">
                            ${timeAgoLabel(ad.minutesAgo)}
                        </div>

                    </div>

                </div>

                <div class="trade-actions">

                    <button
                        class="btn"
                        onclick="showAdDetails('${ad.id}')"
                    >
                        Details
                    </button>

                    <button
                        class="btn primary"
                        onclick="sendTradeRequest('${ad.id}')"
                    >
                        Send Trade
                    </button>

                </div>

            </div>

            <div class="trade-sides">

                <div class="trade-side">

                    <h4>Offering</h4>

                    <div class="trade-slots">
                        ${buildAdSlotHtml(ad.offering)}
                    </div>

                    <div class="trade-stats">

                        <p class="value-text">
                            Value:
                            ${offerValue === null
                                ? "-"
                                : offerValue.toLocaleString()}
                        </p>

                        <p class="rap-text">
                            RAP:
                            ${offerRap === null
                                ? "-"
                                : offerRap.toLocaleString()}
                        </p>

                    </div>

                </div>

                <div class="trade-side">

                    <h4>Requesting</h4>

                    <div class="trade-slots">
                        ${buildAdSlotHtml(ad.requesting)}
                    </div>

                    <div class="trade-stats">

                        <p class="value-text">
                            Value:
                            ${requestValue === null
                                ? "-"
                                : requestValue.toLocaleString()}
                        </p>

                        <p class="rap-text">
                            RAP:
                            ${requestRap === null
                                ? "-"
                                : requestRap.toLocaleString()}
                        </p>

                    </div>

                </div>

            </div>

        </div>

    `;
}
function renderTradeAdsList() {

    const listEl = document.getElementById("tradeAdsList");

    if (!listEl) {
        return;
    }

    const filtered = getFilteredSortedAds();

    const totalPages = Math.max(1, Math.ceil(filtered.length / window.tradeAdsState.perPage));

    if (window.tradeAdsState.page > totalPages) {
        window.tradeAdsState.page = totalPages;
    }

    if (filtered.length === 0) {

    listEl.innerHTML = `
        <div class="placeholder-card">
            No trade ads have been posted yet.
        </div>
    `;



    } else {

        const start = (window.tradeAdsState.page - 1) * window.tradeAdsState.perPage;
        const pageAds = filtered.slice(start, start + window.tradeAdsState.perPage);

        listEl.innerHTML = pageAds.map(buildAdCardHtml).join("");
    }

    renderAdsPagination(totalPages);
}

function renderAdsPagination(totalPages) {

    const current = window.tradeAdsState.page;

    let html = "";

    html += `<button class="page-btn" ${current === 1 ? "disabled" : ""} onclick="goToAdsPage(${current - 1})">«</button>`;

    for (let p = 1; p <= totalPages; p++) {
        html += `<button class="page-btn ${p === current ? "active" : ""}" onclick="goToAdsPage(${p})">${p}</button>`;
    }

    html += `<button class="page-btn" ${current === totalPages ? "disabled" : ""} onclick="goToAdsPage(${current + 1})">»</button>`;

    const top = document.getElementById("adsPaginationTop");
    const bottom = document.getElementById("adsPaginationBottom");

    if (top) top.innerHTML = html;
    if (bottom) bottom.innerHTML = html;
}

window.goToAdsPage = function (page) {

    window.tradeAdsState.page = page;
    renderTradeAdsList();

    const listEl = document.getElementById("tradeAdsList");
    if (listEl) listEl.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.refreshTradeAds = function () {

    renderTradeAdsList();

    showToast("Trade ads refreshed");
};

window.toggleOfferSort = function () {

    window.tradeAdsState.offerSortAsc = !window.tradeAdsState.offerSortAsc;
    document.getElementById("offerSortBtn").classList.toggle("active");
    window.tradeAdsState.page = 1;
    renderTradeAdsList();
};

window.toggleRequestSort = function () {

    // Mirrors the offer sort direction toggle button for symmetry
    window.tradeAdsState.requestSortAsc = !window.tradeAdsState.requestSortAsc;
    document.getElementById("requestSortBtn").classList.toggle("active");
};

window.toggleRequestAnyFilter = function () {

    window.tradeAdsState.requestAnyOnly = !window.tradeAdsState.requestAnyOnly;
    document.getElementById("requestAnyBtn").classList.toggle("active");
    window.tradeAdsState.page = 1;
    renderTradeAdsList();
};

// =========================
// DETAILS / SEND TRADE
// =========================

function itemListHtml(list) {

    if (!list || list.length === 0) return "<p>Nothing</p>";
    if (list[0] === "ANY") return "<p>Any item(s)</p>";

    return list.map(item => `
        <p>${item.name} — Value ${Number(item.value || 0).toLocaleString()}, RAP ${Number(item.rap || 0).toLocaleString()}</p>
    `).join("");
}

window.showAdDetails = function (adId) {

    const ad = window.tradeAdsState.ads.find(a => a.id === adId);

    if (!ad) return;

    const html = `
        <h3>Offering</h3>
        ${itemListHtml(ad.offering)}
        <h3 style="margin-top:14px;">Requesting</h3>
        ${itemListHtml(ad.requesting)}
    `;

    showGenericModal(`${ad.username}'s Trade Ad`, html);
};

window.sendTradeRequest = function (adId) {

    const ad = window.tradeAdsState.ads.find(a => a.id === adId);

    if (!ad) return;

    showToast(`Trade request sent to ${ad.username} (demo only — no backend)`);
};

// =========================
// GENERIC MODAL (details)
// =========================

function showGenericModal(title, bodyHtml) {

    let modal = document.getElementById("genericModal");

    if (!modal) {

        modal = document.createElement("div");
        modal.id = "genericModal";
        modal.className = "modal-backdrop";

        modal.innerHTML = `
            <div class="modal-card">
                <div class="modal-header">
                    <h2 id="genericModalTitle"></h2>
                    <button class="modal-close" onclick="closeGenericModal()">✕</button>
                </div>
                <div id="genericModalBody"></div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener("click", event => {
            if (event.target === modal) closeGenericModal();
        });
    }

    document.getElementById("genericModalTitle").textContent = title;
    document.getElementById("genericModalBody").innerHTML = bodyHtml;

    modal.classList.add("open");
}

window.closeGenericModal = function () {

    const modal = document.getElementById("genericModal");
    if (modal) modal.classList.remove("open");
};

// =========================
// TOAST
// =========================

function showToast(message) {

    let toast = document.getElementById("hxToast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "hxToast";
        toast.className = "hx-toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window._hxToastTimeout);
    window._hxToastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

// =========================
// CREATE AD MODAL
// =========================

window.newAdOffer = [null, null, null, null];
window.newAdRequest = [null, null, null, null];
window.newAdActiveSide = "newOffer";

window.openCreateAdModal = function () {

    window.newAdOffer = [null, null, null, null];
    window.newAdRequest = [null, null, null, null];
    window.newAdActiveSide = "newOffer";

    renderNewAdSlots("newOffer");
    renderNewAdSlots("newRequest");
    buildNewAdItemPicker();

    const toggle = document.getElementById("newAdSideToggle");
    if (toggle) {
        toggle.querySelectorAll(".side-btn").forEach(b => b.classList.remove("active"));
        toggle.querySelector('[data-side="newOffer"]').classList.add("active");
    }

    document.getElementById("createAdModal").classList.add("open");
};

window.closeCreateAdModal = function () {
    document.getElementById("createAdModal").classList.remove("open");
};

function buildNewAdItemPicker() {

    const container = document.getElementById("newAdItemPicker");

    if (!container) return;

    const items = window.allItems || [];

    if (items.length === 0) {
        container.innerHTML = `<div class="placeholder-card">No items loaded</div>`;
        return;
    }

    container.innerHTML = "";

    items.forEach(item => {

        const card = document.createElement("div");
card.className = "calc-item catalog-card item-card";
        card.innerHTML = `
            <img class="calc-image" src="${item.image || ""}" alt="${item.name || "Item"}">
            <b>${item.name || "Unknown Item"}</b>
            <p class="value-text">Value: ${Number(item.value || 0).toLocaleString()}</p>
            <p class="rap-text">RAP: ${Number(item.rap || 0).toLocaleString()}</p>
        `;

        card.addEventListener("click", () => {
            addItemToNewAd(window.newAdActiveSide, item);
        });

        container.appendChild(card);
    });
}

function getNewAdArray(side) {
    return side === "newOffer" ? window.newAdOffer : window.newAdRequest;
}

function addItemToCreateAd(side, item) {

    const arr = getCreateAdArray(side);

    const emptyIndex =
        arr.findIndex(slot => slot === null);


    if (emptyIndex === -1) {
        return;
    }


    arr[emptyIndex] = item;


    renderCreateAdSlots(side);


    updateCreateAdTotals();
}


function clearNewAdSlot(side, index) {

    const arr = getNewAdArray(side);
    arr[index] = null;
    renderNewAdSlots(side);
}

function renderNewAdSlots(side) {

    const arr = getNewAdArray(side);
    const containerId = side === "newOffer" ? "newAdOfferSlots" : "newAdRequestSlots";
    const container = document.getElementById(containerId);

    if (!container) return;

    const slotEls = container.querySelectorAll(".trade-slot");

    slotEls.forEach((slotEl, index) => {

        const item = arr[index];

        if (item === "ANY") {
            slotEl.classList.add("filled");
            slotEl.textContent = "ANY";
        } else if (item) {
            slotEl.classList.add("filled");
            slotEl.innerHTML = `<img src="${item.image || ""}" alt="${item.name || "Item"}">`;
        } else {
            slotEl.classList.remove("filled");
            slotEl.textContent = "+";
        }
    });
}

function setupNewAdSlotRemoval() {

    ["newAdOfferSlots", "newAdRequestSlots"].forEach(containerId => {

        const container = document.getElementById(containerId);
        if (!container) return;

        container.addEventListener("click", event => {

            const slotEl = event.target.closest(".trade-slot");
            if (!slotEl) return;

            const side = slotEl.dataset.side;
            const index = Number(slotEl.dataset.index);
            const arr = getNewAdArray(side);

            if (arr[index]) {
                clearNewAdSlot(side, index);
            }
        });
    });
}

function setupNewAdSideToggle() {

    const toggle = document.getElementById("newAdSideToggle");
    if (!toggle) return;

    toggle.addEventListener("click", event => {

        const btn = event.target.closest(".side-btn");
        if (!btn) return;

        window.newAdActiveSide = btn.dataset.side;

        toggle.querySelectorAll(".side-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
}

window.submitNewAd = function () {

    const offering = window.newAdOffer.filter(Boolean);
    const requesting = window.newAdRequest.filter(Boolean);

    if (offering.length === 0 || requesting.length === 0) {
        showToast("Add at least one item to both sides first");
        return;
    }

    window.tradeAdsState.ads.unshift({
        id: `ad_${Date.now()}_you`,
        username: "You",
        offering,
        requesting,
        minutesAgo: 0
    });

    window.tradeAdsState.page = 1;
    renderTradeAdsList();

    closeCreateAdModal();
    showToast("Trade ad posted!");
};

// =========================
// FILTER INPUT LISTENERS
// =========================

function setupAdsFilterInputs() {

    const offerInput = document.getElementById("offerFilterInput");
    const requestInput = document.getElementById("requestFilterInput");

    if (offerInput) {
        offerInput.addEventListener("input", () => {
            window.tradeAdsState.offerFilterText = offerInput.value;
            window.tradeAdsState.page = 1;
            renderTradeAdsList();
        });
    }

    if (requestInput) {
        requestInput.addEventListener("input", () => {
            window.tradeAdsState.requestFilterText = requestInput.value;
            window.tradeAdsState.page = 1;
            renderTradeAdsList();
        });
    }
}

// =========================
// CREATE AD PAGE (FULL PAGE)
// =========================

window.createAdOffer = [null, null, null, null];
window.createAdRequest = [null, null, null, null];
window.createAdActiveSide = "createOffer";

function setupCreateAdPage() {

    renderCreateAdSlots("createOffer");
    renderCreateAdSlots("createRequest");
    buildCreateAdItemPicker();

    const toggle = document.getElementById("createAdSideToggle");
    if (toggle) {
        toggle.addEventListener("click", event => {
            const btn = event.target.closest(".side-btn");
            if (!btn) return;

            window.createAdActiveSide = btn.dataset.side;
            toggle.querySelectorAll(".side-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    }

    setupCreateAdSlotRemoval();
}

function buildCreateAdItemPicker() {

    const container = document.getElementById("createAdItemPicker");
    if (!container) return;

    const items = window.allItems || [];
    if (items.length === 0) {
        container.innerHTML = `<div class="placeholder-card">No items loaded</div>`;
        return;
    }

    container.innerHTML = "";

    items.forEach(item => {
        const card = document.createElement("div");
card.className = "calc-item catalog-card item-card";
        card.innerHTML = `
            <img class="calc-image" src="${item.image || ""}" alt="${item.name || "Item"}">
            <b>${item.name || "Unknown Item"}</b>
            <p class="value-text">Value: ${Number(item.value || 0).toLocaleString()}</p>
            <p class="rap-text">RAP: ${Number(item.rap || 0).toLocaleString()}</p>
        `;

        card.addEventListener("click", () => {
            addItemToCreateAd(window.createAdActiveSide, item);
        });

        container.appendChild(card);
    });
}

function getCreateAdArray(side) {
    return side === "createOffer" ? window.createAdOffer : window.createAdRequest;
}

function addItemToCreateAd(side, item) {

    const arr = getCreateAdArray(side);
    const emptyIndex = arr.findIndex(slot => slot === null);
    if (emptyIndex === -1) return;

    arr[emptyIndex] = item;
    renderCreateAdSlots(side);
    updateCreateAdTotals();
}

function clearCreateAdSlot(side, index) {

    const arr = getCreateAdArray(side);
    arr[index] = null;
    renderCreateAdSlots(side);
    updateCreateAdTotals();
}

function renderCreateAdSlots(side) {

    const arr = getCreateAdArray(side);
    const containerId = side === "createOffer" ? "createAdOfferSlots" : "createAdRequestSlots";
    const container = document.getElementById(containerId);

    if (!container) return;

    const slotEls = container.querySelectorAll(".trade-slot");

    slotEls.forEach((slotEl, index) => {
        const item = arr[index];

        if (item === "ANY") {
            slotEl.classList.add("filled");
            slotEl.textContent = "ANY";
        } else if (item) {
            slotEl.classList.add("filled");
            slotEl.innerHTML = `<img src="${item.image || ""}" alt="${item.name || "Item"}">`;
        } else {
            slotEl.classList.remove("filled");
            slotEl.textContent = "+";
        }
    });
}

function setupCreateAdSlotRemoval() {

    ["createAdOfferSlots", "createAdRequestSlots"].forEach(containerId => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.addEventListener("click", event => {
            const slotEl = event.target.closest(".trade-slot");
            if (!slotEl) return;

            const side = slotEl.dataset.side;
            const index = Number(slotEl.dataset.index);
            const arr = getCreateAdArray(side);

            if (arr[index]) {
                clearCreateAdSlot(side, index);
            }
        });
    });
}

function updateCreateAdTotals() {

    const offerValue = sumField(window.createAdOffer.filter(Boolean), "value") || 0;
    const offerRap = sumField(window.createAdOffer.filter(Boolean), "rap") || 0;
    const requestValue = sumField(window.createAdRequest.filter(Boolean), "value") || 0;
    const requestRap = sumField(window.createAdRequest.filter(Boolean), "rap") || 0;

    const offerValueEl = document.getElementById("createAdOfferValue");
    const offerRapEl = document.getElementById("createAdOfferRap");
    const requestValueEl = document.getElementById("createAdRequestValue");
    const requestRapEl = document.getElementById("createAdRequestRap");

    if (offerValueEl) offerValueEl.textContent = offerValue.toLocaleString();
    if (offerRapEl) offerRapEl.textContent = offerRap.toLocaleString();
    if (requestValueEl) requestValueEl.textContent = requestValue.toLocaleString();
    if (requestRapEl) requestRapEl.textContent = requestRap.toLocaleString();
}

window.submitCreateAd = function () {

    const offering =
        window.createAdOffer.filter(Boolean);

    const requesting =
        window.createAdRequest.filter(Boolean);


    if (
        offering.length === 0 ||
        requesting.length === 0
    ) {
        showToast(
            "Add at least one item to both sides first"
        );
        return;
    }


    const newAd = {

        id:
        `ad_${Date.now()}_you`,

        username:
        "You",

        offering,

        requesting,

        minutesAgo:
        0
    };


    window.tradeAdsState.ads.unshift(newAd);


    window.tradeAdsState.page = 1;


    renderTradeAdsList();



    // clear slots

    window.createAdOffer =
    [null,null,null,null];


    window.createAdRequest =
    [null,null,null,null];


    renderCreateAdSlots(
        "createOffer"
    );

    renderCreateAdSlots(
        "createRequest"
    );


    updateCreateAdTotals();


    showPage("tradeAds");


    showToast(
        "Trade ad posted!"
    );
};

// =========================
// INIT
// =========================

window.initTradeAds = function(){

    setupAdsFilterInputs();
    setupNewAdSlotRemoval();
    setupNewAdSideToggle();
    setupCreateAdPage();


    function loadTradeItems(){

        if(
            window.allItems &&
            Array.isArray(window.allItems) &&
            window.allItems.length > 0
        ){

            console.log(
                "Trade ads loaded:",
                window.allItems.length,
                "items"
            );





            renderTradeAdsList();

            buildCreateAdItemPicker();

            buildNewAdItemPicker();

            return;

        }


        console.warn(
            "Trade ads waiting for items..."
        );


        setTimeout(
            loadTradeItems,
            250
        );

    }


    loadTradeItems();



    const createModal =
        document.getElementById(
            "createAdModal"
        );


    if(createModal){

        createModal.addEventListener(
            "click",
            event=>{

                if(event.target === createModal){
                    closeCreateAdModal();
                }

            }
        );

    }


};


// AUTO START
document.addEventListener(
    "DOMContentLoaded",
    ()=>{

        if(window.initTradeAds){
            window.initTradeAds();
        }

    }
);