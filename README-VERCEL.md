# Heximons Vercel-ready frontend

This version is configured so the browser talks to the Vercel domain, while
Vercel proxies `/apisite/*` to `https://hexium.zip/apisite/*`.

That avoids the browser CORS problem caused by the Hexium backend only allowing
localhost origins.

## Deploy

Set this folder as the Vercel project root (the folder containing `index.html`
and `vercel.json`) and deploy it as a static site.

Do not use Live Server's URL as the production API base.

## Important

The Hexium backend at `https://hexium.zip` must be online and its API routes
must be reachable by Vercel's servers. The Vercel proxy does not replace the
backend.
