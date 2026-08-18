# Heximons — Vercel deployment

## Project root
The Vercel project root must be the folder containing `index.html` and `vercel.json`.

## API architecture
The browser calls:
`/apisite/...`

Vercel rewrites those requests server-side to:
`https://hexium.zip/apisite/...`

This avoids browser CORS problems between the Vercel frontend and Hexium.

## Deploy
1. Upload/push this folder to GitHub.
2. Import the repository into Vercel.
3. Leave Framework Preset as **Other** (static site) unless Vercel detects otherwise.
4. Set the Root Directory to this folder if it is nested in a larger repo.
5. Build Command: leave empty.
6. Output Directory: `.` (or leave default for a static project).
7. Deploy.

## Important
Do not change the frontend API base to `https://hexium.zip` in production. `js/api.js` intentionally uses the Vercel origin in production and direct Hexium only for localhost development.

The Hexium backend must still be online and expose the `/apisite/*` endpoints. The Vercel rewrite is only a proxy; it does not create the backend routes.

## Files that directly link to Hexium
`player.js` and `leaderboard.js` contain profile links to `https://hexium.zip/users/.../profile`. Those are normal navigation links and do not need CORS.
