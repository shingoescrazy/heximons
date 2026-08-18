// =========================
// HEXIUM PLAYER LOOKUP
// =========================

(function () {
    "use strict";

    let lookupRequestId = 0;

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getLookupButton(input) {
        return input
            ?.closest(".player-lookup-box")
            ?.querySelector("button");
    }

    function setLookupBusy(input, isBusy) {
        const button = getLookupButton(input);

        if (button) {
            button.disabled = isBusy;
            button.textContent = isBusy ? "Searching..." : "Search";
        }

        if (input) {
            input.setAttribute("aria-busy", String(isBusy));
        }
    }

    function getRapText(rapResult) {
        if (typeof rapResult === "number") {
            return `RAP R$ ${Math.max(0, rapResult).toLocaleString()}`;
        }

        if (rapResult?.status === "private") {
            return "RAP unavailable — private inventory";
        }

        if (rapResult?.status === "unavailable") {
            return "RAP unavailable";
        }

        const rap = Number(rapResult?.rap || 0);
        return `RAP R$ ${Math.max(0, rap).toLocaleString()}`;
    }

    function getLookupErrorMessage(error) {
        if (error?.code === "NETWORK_OR_CORS") {
            return "Could not reach the Hexium API. Check that the Vercel API rewrite is deployed and hexium.zip is online.";
        }

        if (error?.code === "TIMEOUT") {
            return "Hexium took too long to respond. Try again.";
        }

        if (error?.status === 404) {
            return "Player not found on Hexium.";
        }

        return "Failed to look up that player.";
    }

    window.lookupPlayer = async function () {
        const input = document.getElementById("playerSearch");
        const result = document.getElementById("playerResult");

        if (!input || !result) {
            return;
        }

        if (typeof window.hexiumLookupUsername !== "function") {
            result.innerHTML = `
                <div class="placeholder-card">
                    The Hexium API client did not load.
                </div>
            `;
            return;
        }

        const username = input.value.trim();

        if (!username) {
            result.innerHTML = `
                <div class="placeholder-card">
                    Enter a username.
                </div>
            `;
            input.focus();
            return;
        }

        const currentRequestId = ++lookupRequestId;
        setLookupBusy(input, true);

        result.innerHTML = `
            <div class="placeholder-card">
                Searching Hexium...
            </div>
        `;

        try {
            const user = await window.hexiumLookupUsername(username);

            if (currentRequestId !== lookupRequestId) {
                return;
            }

            if (!user) {
                result.innerHTML = `
                    <div class="placeholder-card">
                        Player not found on Hexium.
                    </div>
                `;
                return;
            }

            const [avatarResult, rapResult] = await Promise.allSettled([
                window.hexiumGetAvatarHeadshots([user.id]),
                window.hexiumGetUserRap(user.id)
            ]);

            if (currentRequestId !== lookupRequestId) {
                return;
            }

            const avatarMap = avatarResult.status === "fulfilled"
                ? avatarResult.value
                : new Map();
            const avatarUrl = avatarMap.get(user.id) || "";
            const rap = rapResult.status === "fulfilled"
                ? rapResult.value
                : { status: "unavailable", rap: null };

            if (avatarResult.status === "rejected") {
                console.warn("Avatar lookup failed:", avatarResult.reason);
            }

            if (rapResult.status === "rejected") {
                console.warn("RAP lookup failed:", rapResult.reason);
            }

            const safeName = escapeHtml(user.name);
            const safeAvatarUrl = escapeHtml(avatarUrl);
            const profileUrl = `https://hexium.zip/users/${encodeURIComponent(user.id)}/profile`;

            result.innerHTML = `
                <div class="player-card">
                    ${
                        avatarUrl
                            ? `<img src="${safeAvatarUrl}" alt="${safeName}" loading="lazy" referrerpolicy="no-referrer">`
                            : ""
                    }

                    <h2>${safeName}</h2>

                    <p>
                        User ID: ${user.id} &middot;
                        ${escapeHtml(getRapText(rap))}
                    </p>

                    <a class="btn btn-primary" href="${profileUrl}" target="_blank" rel="noopener noreferrer">
                        View Hexium Profile
                    </a>
                </div>
            `;
        }
        catch (error) {
            if (currentRequestId !== lookupRequestId) {
                return;
            }

            console.error("Player lookup failed:", error);

            result.innerHTML = `
                <div class="placeholder-card">
                    ${escapeHtml(getLookupErrorMessage(error))}
                </div>
            `;
        }
        finally {
            if (currentRequestId === lookupRequestId) {
                setLookupBusy(input, false);
            }
        }
    };

    // =========================
    // ENTER KEY SUPPORT
    // =========================

    document.addEventListener("DOMContentLoaded", () => {
        const input = document.getElementById("playerSearch");

        if (!input) {
            return;
        }

        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                window.lookupPlayer();
            }
        });
    });
})();
