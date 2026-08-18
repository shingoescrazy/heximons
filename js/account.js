// =========================
// HEXIUM ACCOUNT LINKING
// =========================

(function () {
    let currentPhrase = null;
    let currentUserId = null;

    function getToken() {
        return localStorage.getItem("heximons_account_token") || "";
    }

    function setToken(token) {
        localStorage.setItem("heximons_account_token", token);
    }

    function clearToken() {
        localStorage.removeItem("heximons_account_token");
    }

    function showStatus(message) {
        const el = document.getElementById("linkStatus");
        if (el) el.textContent = message;
    }

    async function checkExistingLink() {
        const token = getToken();
        const box = document.getElementById("linkAccountBox");
        if (!box) return;

        if (!token) {
            renderUnlinked();
            return;
        }

        try {
            const response = await fetch(`/api/account/me?token=${encodeURIComponent(token)}`);

            if (!response.ok) {
                clearToken();
                renderUnlinked();
                return;
            }

            const data = await response.json();
            renderLinked(data.username);
        }
        catch {
            renderUnlinked();
        }
    }

    function renderUnlinked() {
        const box = document.getElementById("linkAccountBox");
        box.innerHTML = `
            <p class="catalog-toolbar">
                Link your Hexium account to Heximons. Go to your Hexium profile page \u2014
                the number in the URL (e.g. hexium.zip/users/<strong>4</strong>/profile) is your User ID.
            </p>
            <input id="linkUsernameInput" type="text" inputmode="numeric" placeholder="Your Hexium User ID (numbers only)" class="search-lg">
            <button class="btn btn-primary" id="linkStartBtn">Get Verification Phrase</button>
            <p id="linkStatus"></p>
        `;
        document.getElementById("linkStartBtn").onclick = startLink;
    }

    function renderPendingVerification(phrase) {
        const box = document.getElementById("linkAccountBox");
        box.innerHTML = `
            <p class="catalog-toolbar">
                Paste this phrase anywhere in your Hexium "About Me" / bio, save it, then click Verify.
            </p>
            <div class="link-phrase-box">${phrase}</div>
            <button class="btn btn-primary" id="linkVerifyBtn">I added it — Verify</button>
            <p id="linkStatus"></p>
        `;
        document.getElementById("linkVerifyBtn").onclick = verifyLink;
    }

    function renderLinked(username) {
        const box = document.getElementById("linkAccountBox");
        box.innerHTML = `
            <p class="catalog-toolbar">✅ Connected as <strong>${username}</strong></p>
            <button class="btn btn-ghost" id="linkDisconnectBtn">Disconnect</button>
        `;
        document.getElementById("linkDisconnectBtn").onclick = () => {
            clearToken();
            renderUnlinked();
        };
    }

    async function startLink() {
        const rawInput = document.getElementById("linkUsernameInput").value.trim();
        const userId = Number(rawInput);

        if (!rawInput || !Number.isInteger(userId) || userId <= 0) {
            showStatus("Enter a valid numeric Hexium User ID (not a username).");
            return;
        }

        showStatus("Looking up your account...");

        try {
            const profile = await window.hexiumGetUser(userId);

            if (!profile || !profile.name) {
                showStatus("No Hexium user found with that ID.");
                return;
            }

            const response = await fetch("/api/account/start-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: profile.id, username: profile.name })
            });

            const data = await response.json();

            if (!response.ok) {
                showStatus(data.error || "Something went wrong.");
                return;
            }

            currentPhrase = data.phrase;
            currentUserId = data.userId;
            renderPendingVerification(data.phrase);
        }
        catch (error) {
            showStatus("Failed to reach server: " + error.message);
        }
    }

    async function verifyLink() {
        showStatus("Checking your Hexium bio...");

        try {
            const profile = await window.hexiumGetUser(currentUserId);
            const bio = String(profile?.description ?? profile?.Description ?? "");

            const response = await fetch("/api/account/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUserId, bio })
            });

            const data = await response.json();

            if (!response.ok) {
                showStatus(data.error || "Something went wrong.");
                return;
            }

            if (!data.verified) {
                showStatus(data.message || "Phrase not found yet.");
                return;
            }

            setToken(data.token);
            renderLinked(data.username);
        }
        catch (error) {
            showStatus("Failed to reach server: " + error.message);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", checkExistingLink);
    }
    else {
        checkExistingLink();
    }
})();
