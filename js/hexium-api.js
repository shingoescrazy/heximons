// Legacy filename retained so old references fail clearly.
// The working Hexium client is now js/api.js.
if (!window.HexiumAPI) {
    console.error(
        "Heximons API client is missing. Load ./js/api.js before player.js and leaderboard.js."
    );
}
