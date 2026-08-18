// =========================
// HEXIUM PLAYER LEADERBOARD
// =========================

(function () {
    "use strict";

    const PLAYERS_PER_PAGE = 12;

    let leaderboardPage = 1;
    let leaderboardRequestId = 0;

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getLeaderboardErrorMessage(error) {
        if (error?.code === "LEADERBOARD_NOT_INSTALLED") {
            return "The leaderboard route is not installed on hexium.zip yet. Deploy the two included C# backend files, rebuild Roblox.Website, and restart it.";
        }

        if (error?.code === "NETWORK_OR_CORS") {
            return "Could not reach the Hexium API. Check that the Vercel API rewrite is deployed and hexium.zip is online.";
        }

        if (error?.code === "TIMEOUT") {
            return "Hexium took too long to load the leaderboard.";
        }

        return "Failed to load the leaderboard.";
    }

    window.buildLeaderboard = async function () {
        const grid = document.getElementById("leaderboardGrid");
        const pagination = document.getElementById("leaderboardPagination");

        if (!grid) {
            return;
        }

        if (typeof window.hexiumGetRapLeaderboard !== "function") {
            grid.innerHTML = `
                <div class="placeholder-card">
                    The Hexium API client did not load.
                </div>
            `;
            return;
        }

        const currentRequestId = ++leaderboardRequestId;

        grid.setAttribute("aria-busy", "true");
        grid.innerHTML = `
            <div class="placeholder-card">Loading leaderboard...</div>
        `;

        try {
            const offset = (leaderboardPage - 1) * PLAYERS_PER_PAGE;
            const response = await window.hexiumGetRapLeaderboard(
                PLAYERS_PER_PAGE,
                offset
            );

            if (currentRequestId !== leaderboardRequestId) {
                return;
            }

            const players = Array.isArray(response?.data)
                ? response.data
                : [];
            const totalUsers = Math.max(
                players.length,
                Number(response?.totalUsers || 0)
            );

            if (players.length === 0) {
                grid.innerHTML = `
                    <div class="placeholder-card">
                        No ranked players yet.
                    </div>
                `;

                if (pagination) {
                    pagination.innerHTML = "";
                }

                return;
            }

            grid.innerHTML = players.map((player, index) => {
                const username = escapeHtml(player.username);
                const userId = Number(player.userId);
                const totalRap = Math.max(0, Number(player.totalRap || 0));
                const profileUrl = `https://hexium.zip/users/${encodeURIComponent(userId)}/profile`;

                return `
                    <a class="leaderboard-card" href="${profileUrl}" target="_blank" rel="noopener noreferrer">
                        <div class="lb-rank">Rank #${offset + index + 1}</div>
                        <div class="lb-name">${username}</div>
                        <div class="lb-stats">
                            <span class="lb-rap">RAP <b>R$ ${totalRap.toLocaleString()}</b></span>
                        </div>
                    </a>
                `;
            }).join("");

            const totalPages = Math.max(
                1,
                Math.ceil(totalUsers / PLAYERS_PER_PAGE)
            );

            if (leaderboardPage > totalPages) {
                leaderboardPage = totalPages;
                window.buildLeaderboard();
                return;
            }

            if (pagination) {
                renderPagination(pagination, totalPages);
            }
        }
        catch (error) {
            if (currentRequestId !== leaderboardRequestId) {
                return;
            }

            console.error("Leaderboard load failed:", error);

            grid.innerHTML = `
                <div class="placeholder-card">
                    <p>${escapeHtml(getLeaderboardErrorMessage(error))}</p>
                    <button class="btn btn-primary" type="button" data-leaderboard-retry>
                        Retry
                    </button>
                </div>
            `;

            grid
                .querySelector("[data-leaderboard-retry]")
                ?.addEventListener("click", () => window.buildLeaderboard());

            if (pagination) {
                pagination.innerHTML = "";
            }
        }
        finally {
            if (currentRequestId === leaderboardRequestId) {
                grid.removeAttribute("aria-busy");
            }
        }
    };

    // =========================
    // PAGINATION CONTROLS
    // =========================

    function renderPagination(container, totalPages) {
        const buttons = [];

        buttons.push(`
            <button
                class="lp-btn"
                type="button"
                data-page="prev"
                ${leaderboardPage <= 1 ? "disabled" : ""}
                aria-label="Previous leaderboard page"
            >&#9664;</button>
        `);

        getPageNumbers(leaderboardPage, totalPages).forEach(entry => {
            if (entry === "...") {
                buttons.push(`<span class="lp-ellipsis">&hellip;</span>`);
                return;
            }

            buttons.push(`
                <button
                    class="lp-btn${entry === leaderboardPage ? " active" : ""}"
                    type="button"
                    data-page="${entry}"
                    ${entry === leaderboardPage ? 'aria-current="page"' : ""}
                >${entry}</button>
            `);
        });

        buttons.push(`
            <button
                class="lp-btn"
                type="button"
                data-page="next"
                ${leaderboardPage >= totalPages ? "disabled" : ""}
                aria-label="Next leaderboard page"
            >&#9654;</button>
        `);

        container.innerHTML = buttons.join("");

        container.querySelectorAll(".lp-btn").forEach(button => {
            button.addEventListener("click", () => {
                if (button.disabled) {
                    return;
                }

                const page = button.dataset.page;
                const previousPage = leaderboardPage;

                if (page === "prev") {
                    leaderboardPage = Math.max(1, leaderboardPage - 1);
                }
                else if (page === "next") {
                    leaderboardPage = Math.min(totalPages, leaderboardPage + 1);
                }
                else {
                    const parsedPage = Number.parseInt(page, 10);
                    if (Number.isInteger(parsedPage)) {
                        leaderboardPage = Math.min(
                            totalPages,
                            Math.max(1, parsedPage)
                        );
                    }
                }

                if (leaderboardPage !== previousPage) {
                    window.buildLeaderboard();
                }
            });
        });
    }

    function getPageNumbers(current, total) {
        const pages = [];
        const spread = 2;

        for (let page = 1; page <= total; page += 1) {
            if (
                page === 1 ||
                page === total ||
                (page >= current - spread && page <= current + spread)
            ) {
                pages.push(page);
            }
            else if (pages[pages.length - 1] !== "...") {
                pages.push("...");
            }
        }

        return pages;
    }

    document.addEventListener("DOMContentLoaded", () => {
        window.buildLeaderboard();
    });
})();
