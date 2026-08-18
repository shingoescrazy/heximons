// =========================
// HEXIMONS NAVBAR SEARCH
// Delegates to window.searchCatalog (defined in catalog.js)
// =========================

document.addEventListener("DOMContentLoaded", () => {

    const search = document.getElementById("searchBar");

    if (!search) {
        return;
    }

    search.addEventListener("input", () => {

        if (search.value.trim()) {
            showPage("catalog");
        }

        if (typeof window.searchCatalog === "function") {
            window.searchCatalog();
        }
    });

    search.addEventListener("keydown", event => {

        if (event.key === "Enter") {
            showPage("catalog");

            if (typeof window.searchCatalog === "function") {
                window.searchCatalog();
            }
        }
    });
});
