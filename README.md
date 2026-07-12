# Jay Cheque — Cloudflare Pages Deploy

## Files in this folder

```
index.html                   ← the whole app (no build step)
functions/scan-receipt.js    ← Cloudflare Worker that calls Claude's API
README.md                    ← this file
```

## Step 1 — Get an Anthropic API key

This is separate from your claude.ai login.

1. Go to https://console.anthropic.com
2. API Keys → Create a new key, copy it
3. Billing → Add a small amount of credit (each receipt scan costs a fraction of a cent)

## Step 2 — Push to GitHub

1. Create a new repo on GitHub (e.g. `jay-cheque`)
2. Push this folder to it

```bash
git init
git add .
git commit -m "Jay Cheque"
git remote add origin https://github.com/YOUR_USERNAME/jay-cheque.git
git push -u origin main
```

## Step 3 — Deploy on Cloudflare Pages

1. Go to https://dash.cloudflare.com → Pages → Create a project
2. Connect to GitHub → pick your `jay-cheque` repo
3. Build settings:
   - Framework preset: None
   - Build command: (leave blank)
   - Build output directory: `/` (just a slash)
4. Click Save and Deploy

## Step 4 — Add the API key

1. In your Cloudflare Pages project → Settings → Environment Variables
2. Add:
   - Variable name: `ANTHROPIC_API_KEY`
   - Value: the key from Step 1
   - Set for both Production and Preview
3. Go to Deployments → Retry deployment (so the Worker picks up the key)

## Step 5 — Connect jaycheque.jimmymo.online

1. In Cloudflare Pages → Custom domains → Add a custom domain
2. Enter: `jaycheque.jimmymo.online`
3. Since your DNS is already on Cloudflare, it'll auto-configure — takes about 1 minute

## Step 6 — Add to phone home screen

Once live at jaycheque.jimmymo.online:

- **iPhone (Safari):** Share icon → Add to Home Screen → name it "Jay Cheque"
- **Android (Chrome):** ⋮ menu → Add to Home Screen

No login needed for anyone using it — it's a regular website.
