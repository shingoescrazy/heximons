// =========================
// HEXIUM API CLIENT
// js/api.js
// =========================

(function () {
    "use strict";

    // In production on Vercel, use the Vercel origin. vercel.json
    // transparently proxies /apisite/* to https://hexium.zip/apisite/*.
    // api.js itself requests /apisite/*, so vercel.json must match that
    // exact prefix (not /api/*).
    //
    // During local development, keep using the real Hexium host so Live
    // Server continues to work with the backend's localhost CORS policy.
    const isLocalDevelopment =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "::1";

    const DEFAULT_API_BASE = isLocalDevelopment
        ? "https://hexium.zip"
        : window.location.origin;

    const DEFAULT_TIMEOUT_MS = 15000;

    function normalizeBaseUrl(value) {
        const raw = String(value || DEFAULT_API_BASE).trim();
        return raw.replace(/\/+$/, "");
    }

    const API_BASE = normalizeBaseUrl(
        window.HEXIUM_API_BASE || DEFAULT_API_BASE
    );

    // Keep this public so it can be overridden before api.js loads:
    // <script>window.HEXIUM_API_BASE = "https://example.com";</script>
    window.HEXIUM_API_BASE = API_BASE;

    class HexiumApiError extends Error {
        constructor(message, options = {}) {
            super(message);
            this.name = "HexiumApiError";
            this.status = Number(options.status || 0);
            this.code = options.code || "HEXIUM_API_ERROR";
            this.url = options.url || "";
            this.details = options.details ?? null;
        }
    }

    function buildUrl(path) {
        if (/^https?:\/\//i.test(path)) {
            return path;
        }

        return `${API_BASE}/${String(path || "").replace(/^\/+/, "")}`;
    }

    function resolveAssetUrl(value) {
        if (!value) {
            return "";
        }

        try {
            return new URL(String(value), `${API_BASE}/`).href;
        }
        catch {
            return "";
        }
    }

    function toPositiveInteger(value, label) {
        const number = Number(value);

        if (!Number.isSafeInteger(number) || number < 1) {
            throw new TypeError(`${label} must be a positive integer.`);
        }

        return number;
    }

    async function readResponseBody(response) {
        const contentType = response.headers.get("content-type") || "";

        if (response.status === 204) {
            return null;
        }

        if (contentType.includes("application/json")) {
            try {
                return await response.json();
            }
            catch {
                return null;
            }
        }

        try {
            const text = await response.text();
            return text || null;
        }
        catch {
            return null;
        }
    }

    function getErrorMessage(body, fallback) {
        if (!body) {
            return fallback;
        }

        if (typeof body === "string") {
            return body.slice(0, 300) || fallback;
        }

        return (
            body.message ||
            body.Message ||
            body.error ||
            body.Error ||
            body.errors?.[0]?.message ||
            body.errors?.[0]?.Message ||
            fallback
        );
    }

    let cachedCsrfToken = "";

    async function request(path, options = {}, isRetry = false) {
        const url = buildUrl(path);
        const controller = new AbortController();
        const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS);
        const timeoutId = window.setTimeout(
            () => controller.abort(),
            timeoutMs
        );

        const headers = new Headers(options.headers || {});
        headers.set("Accept", "application/json");

        if (options.body !== undefined && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }

        if (cachedCsrfToken && !headers.has("X-CSRF-TOKEN")) {
            headers.set("X-CSRF-TOKEN", cachedCsrfToken);
        }

        try {
            const response = await fetch(url, {
                method: options.method || "GET",
                headers,
                body: options.body,
                signal: controller.signal,
                credentials: options.credentials || "same-origin",
                cache: options.cache || "no-store"
            });

            // Roblox-style CSRF protection: a POST/PUT/DELETE without a
            // valid token gets rejected once with a fresh token in the
            // response headers. Capture it and retry automatically.
            const freshToken = response.headers.get("x-csrf-token");
            if (freshToken) {
                cachedCsrfToken = freshToken;
            }

            if (response.status === 403 && freshToken && !isRetry) {
                window.clearTimeout(timeoutId);
                return request(path, options, true);
            }

            const body = await readResponseBody(response);

            if (!response.ok) {
                throw new HexiumApiError(
                    getErrorMessage(
                        body,
                        `Hexium API returned HTTP ${response.status}.`
                    ),
                    {
                        status: response.status,
                        code: `HTTP_${response.status}`,
                        url,
                        details: body
                    }
                );
            }

            return body;
        }
        catch (error) {
            if (error instanceof HexiumApiError) {
                throw error;
            }

            if (error?.name === "AbortError") {
                throw new HexiumApiError(
                    "The Hexium API request timed out.",
                    {
                        code: "TIMEOUT",
                        url
                    }
                );
            }

            throw new HexiumApiError(
                "Could not reach the Hexium API. This is usually a network or CORS problem.",
                {
                    code: "NETWORK_OR_CORS",
                    url,
                    details: error?.message || String(error)
                }
            );
        }
        finally {
            window.clearTimeout(timeoutId);
        }
    }

    function normalizeUser(entry, fallbackName = "") {
        if (!entry || typeof entry !== "object") {
            return null;
        }

        const id = Number(entry.id ?? entry.Id ?? entry.userId ?? entry.UserId);
        const name = String(
            entry.name ??
            entry.Name ??
            entry.username ??
            entry.Username ??
            fallbackName ??
            ""
        ).trim();

        if (!Number.isSafeInteger(id) || id < 1 || !name) {
            return null;
        }

        return {
            id,
            name,
            displayName: String(
                entry.displayName ??
                entry.DisplayName ??
                name
            ),
            requestedName: String(
                entry.requestedName ??
                entry.RequestedName ??
                fallbackName ??
                name
            )
        };
    }

    // =========================
    // USERNAME LOOKUP
    // POST /apisite/users/v1/usernames/users
    // =========================

    async function lookupUsername(username) {
        const cleanUsername = String(username || "").trim();

        if (!cleanUsername) {
            return null;
        }

        if (cleanUsername.length > 50) {
            throw new TypeError("Username is too long.");
        }

        const payload = await request(
            "/apisite/users/v1/usernames/users",
            {
                method: "POST",
                body: JSON.stringify({
                    usernames: [cleanUsername]
                })
            }
        );

        const entries = Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.Data)
                ? payload.Data
                : [];

        return normalizeUser(entries[0], cleanUsername);
    }

    // =========================
    // USER PROFILE
    // GET /apisite/users/v1/users/{userId}
    // =========================

    async function getUser(userId) {
        const id = toPositiveInteger(userId, "userId");
        const data = await request(
            `/apisite/users/v1/users/${encodeURIComponent(id)}`
        );

        const user = normalizeUser(data);

        if (!user) {
            throw new HexiumApiError(
                "Hexium returned an invalid user response.",
                {
                    code: "INVALID_USER_RESPONSE"
                }
            );
        }

        return {
            ...data,
            ...user
        };
    }

    // =========================
    // AVATAR HEADSHOTS
    // GET /apisite/thumbnails/v1/users/avatar-headshot
    // =========================

    async function getAvatarHeadshots(userIds) {
        const ids = Array.from(
            new Set(
                (Array.isArray(userIds) ? userIds : [userIds])
                    .map(Number)
                    .filter(id => Number.isSafeInteger(id) && id > 0)
            )
        ).slice(0, 200);

        const avatarMap = new Map();

        if (ids.length === 0) {
            return avatarMap;
        }

        const payload = await request(
            `/apisite/thumbnails/v1/users/avatar-headshot?userIds=${encodeURIComponent(ids.join(","))}`
        );

        const entries = Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.Data)
                ? payload.Data
                : [];

        entries.forEach(entry => {
            const targetId = Number(
                entry?.targetId ?? entry?.TargetId ?? entry?.id ?? entry?.Id
            );
            const imageUrl = resolveAssetUrl(
                entry?.imageUrl ?? entry?.ImageUrl
            );

            if (Number.isSafeInteger(targetId) && targetId > 0 && imageUrl) {
                avatarMap.set(targetId, imageUrl);
            }
        });

        return avatarMap;
    }

    // =========================
    // USER RAP
    // GET /apisite/inventory/v1/users/{userId}/assets/collectibles
    // =========================

    async function getUserRap(userId) {
        const id = toPositiveInteger(userId, "userId");

        try {
            const payload = await request(
                `/apisite/inventory/v1/users/${encodeURIComponent(id)}/assets/collectibles?limit=1&sortOrder=desc`
            );

            const rap = Number(
                payload?.totalRap ?? payload?.TotalRap ?? 0
            );

            return {
                status: "ok",
                rap: Number.isFinite(rap) ? Math.max(0, Math.trunc(rap)) : 0
            };
        }
        catch (error) {
            if (error instanceof HexiumApiError && error.status === 403) {
                return {
                    status: "private",
                    rap: null
                };
            }

            if (error instanceof HexiumApiError && error.status === 404) {
                return {
                    status: "unavailable",
                    rap: null
                };
            }

            throw error;
        }
    }

    // =========================
    // RAP LEADERBOARD
    // Requires the included backend patch.
    // GET /apisite/inventory/v1/leaderboard/rap
    // =========================

    async function getRapLeaderboard(limit = 12, offset = 0) {
        const safeLimit = Math.min(
            100,
            Math.max(1, Math.trunc(Number(limit) || 12))
        );
        const safeOffset = Math.max(
            0,
            Math.trunc(Number(offset) || 0)
        );

        let payload;

        try {
            payload = await request(
                `/apisite/inventory/v1/leaderboard/rap?limit=${safeLimit}&offset=${safeOffset}`
            );
        }
        catch (error) {
            if (
                error instanceof HexiumApiError &&
                (error.status === 404 || error.status === 405)
            ) {
                throw new HexiumApiError(
                    "The RAP leaderboard backend route is not installed on hexium.zip yet.",
                    {
                        status: error.status,
                        code: "LEADERBOARD_NOT_INSTALLED",
                        url: error.url,
                        details: error.details
                    }
                );
            }

            throw error;
        }

        const rawPlayers = Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.Data)
                ? payload.Data
                : [];

        const data = rawPlayers
            .map(entry => {
                const userId = Number(
                    entry?.userId ?? entry?.UserId ?? entry?.id ?? entry?.Id
                );
                const username = String(
                    entry?.username ??
                    entry?.Username ??
                    entry?.name ??
                    entry?.Name ??
                    ""
                ).trim();
                const totalRap = Number(
                    entry?.totalRap ?? entry?.TotalRap ?? entry?.rap ?? entry?.Rap ?? 0
                );

                if (
                    !Number.isSafeInteger(userId) ||
                    userId < 1 ||
                    !username
                ) {
                    return null;
                }

                return {
                    userId,
                    username,
                    totalRap: Number.isFinite(totalRap)
                        ? Math.max(0, Math.trunc(totalRap))
                        : 0
                };
            })
            .filter(Boolean);

        const totalUsersValue = Number(
            payload?.totalUsers ?? payload?.TotalUsers ?? data.length
        );

        return {
            data,
            totalUsers: Number.isFinite(totalUsersValue)
                ? Math.max(data.length, Math.trunc(totalUsersValue))
                : data.length
        };
    }

    window.HexiumApiError = HexiumApiError;

    window.HexiumAPI = Object.freeze({
        baseUrl: API_BASE,
        request,
        lookupUsername,
        getUser,
        getAvatarHeadshots,
        getUserRap,
        getRapLeaderboard,
        resolveAssetUrl
    });

    // Backward-compatible globals used by the existing Heximons scripts.
    window.hexiumLookupUsername = lookupUsername;
    window.hexiumGetUser = getUser;
    window.hexiumGetAvatarHeadshots = getAvatarHeadshots;
    window.hexiumGetUserRap = getUserRap;
    window.hexiumGetRapLeaderboard = getRapLeaderboard;

    console.info(`Heximons API connected to ${API_BASE}`);
})();
