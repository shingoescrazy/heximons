// =========================
// HEXIMONS NEW LIMITEDS ROW
// =========================
// Populates the homepage "New Limiteds" strip using the same
// item data already loaded into window.allItems by app.js.

window.loadLimiteds = function () {

    const row = document.getElementById("newLimitedsRow");

    if (!row) {
        return;
    }

    const items = Array.isArray(window.allItems) ? window.allItems : [];

    if (items.length === 0) {
        row.innerHTML = `<div class="placeholder-card">No items loaded yet.</div>`;
        return;
    }

    // Most recently added first, capped to a reasonable row length.
    const newest = items.slice().reverse().slice(0, 10);

    row.innerHTML = newest.map(item => {

        const value = Number(item.value || 0);
        const rap = Number(item.rap || 0);

        return `
            <div class="item-card" onclick="window.showItemPage && window.showItemPage(${item.id})">
                <div class="item-frame">
                    <span class="item-badge">Limited</span>
                    <img src="${item.image || ""}" alt="${item.name || "Item"}" loading="lazy">
                </div>
                <div class="item-name">${item.name || "Unknown Item"}</div>
                <div class="item-stat">Value <b>${value.toLocaleString()}</b></div>
                <div class="item-stat">RAP <b>${rap.toLocaleString()}</b></div>
            </div>
        `;

    }).join("");

};
