// =========================
// HEXIMONS ADMIN PANEL
// =========================

(function () {
    let allItems = [];
    let selectedItem = null;

    function getStoredPassword() {
        return sessionStorage.getItem("heximons_admin_pw") || "";
    }

    function setStoredPassword(pw) {
        sessionStorage.setItem("heximons_admin_pw", pw);
    }

    async function loadItems() {
        const list = document.getElementById("adminItemList");
        list.textContent = "Loading items...";

        try {
            const response = await fetch("/api/items");
            allItems = await response.json();
            renderList(allItems);
        }
        catch (error) {
            list.textContent = "Failed to load items: " + error.message;
        }
    }

    function renderList(items) {
        const list = document.getElementById("adminItemList");
        list.innerHTML = "";

        items.slice(0, 100).forEach(item => {
            const row = document.createElement("div");
            row.className = "admin-item-row";
            row.textContent = `${item.name} (#${item.id})`;
            row.onclick = () => selectItem(item);
            list.appendChild(row);
        });

        if (items.length === 0) {
            list.textContent = "No items match your search.";
        }
    }

    function selectItem(item) {
        selectedItem = item;

        document.getElementById("adminSelectedName").textContent = item.name;
        document.getElementById("adminValueInput").value = item.value || 0;
        document.getElementById("adminRapInput").value = item.rap || 0;
        document.getElementById("adminDemandSelect").value = item.demand || "Unassigned";
        document.getElementById("adminTrendSelect").value = item.trend || "Stable";
        document.getElementById("adminForm").style.display = "block";
        document.getElementById("adminStatus").textContent = "";
    }

    async function saveItem() {
        if (!selectedItem) return;

        const status = document.getElementById("adminStatus");
        status.textContent = "Saving...";

        const body = {
            password: getStoredPassword(),
            id: selectedItem.id,
            value: Number(document.getElementById("adminValueInput").value),
            rap: Number(document.getElementById("adminRapInput").value),
            demand: document.getElementById("adminDemandSelect").value,
            trend: document.getElementById("adminTrendSelect").value
        };

        try {
            const response = await fetch("/api/admin/update-item", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    status.textContent = "Wrong password. Try refreshing and re-entering it.";
                    sessionStorage.removeItem("heximons_admin_pw");
                }
                else {
                    status.textContent = "Error: " + (result.message || result.error);
                }
                return;
            }

            status.textContent = "Saved!";
        }
        catch (error) {
            status.textContent = "Failed to save: " + error.message;
        }
    }

    function setupAdminPage() {
        const pwInput = document.getElementById("adminPasswordInput");
        const pwSubmit = document.getElementById("adminPasswordSubmit");
        const searchInput = document.getElementById("adminSearchInput");
        const saveBtn = document.getElementById("adminSaveBtn");

        if (!pwSubmit) return; // admin page not on this build yet

        if (getStoredPassword()) {
            document.getElementById("adminGate").style.display = "none";
            document.getElementById("adminPanel").style.display = "block";
            loadItems();
        }

        pwSubmit.onclick = () => {
            setStoredPassword(pwInput.value);
            document.getElementById("adminGate").style.display = "none";
            document.getElementById("adminPanel").style.display = "block";
            loadItems();
        };

        searchInput.oninput = () => {
            const q = searchInput.value.toLowerCase();
            renderList(allItems.filter(item => item.name.toLowerCase().includes(q)));
        };

        saveBtn.onclick = saveItem;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setupAdminPage);
    }
    else {
        setupAdminPage();
    }
})();
