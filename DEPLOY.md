# Putting Al-Miftah online

The app is a static site — no server, no database, no build step. Hosting it is free
on every option below. The search index is **not** part of the upload: the workflow
publishes it to the `data` branch, and the app fetches it from the jsDelivr CDN
automatically. So whichever host you pick, you only ever publish a few small files.

---

## Option 1 — GitHub Pages (recommended)

Everything for this is already in the repository; only one setting is missing, and it
can only be changed by the repository owner (a workflow token is not permitted to).

1. Open **https://github.com/simple905boy-a11y/rtu/settings/pages**
   (on a phone, switch the browser to "Desktop site" first — the mobile layout hides it).
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
   Not "Deploy from a branch" — that mode ignores the workflow.
3. Actions tab → **Build search index & deploy site** → **Run workflow**.

Live at **https://simple905boy-a11y.github.io/rtu/**, and it redeploys on every push.

## Option 2 — Cloudflare Pages

1. https://pages.cloudflare.com → **Create a project → Connect to Git** → pick `rtu`.
2. Framework preset: **None**. Build command: *leave empty*. Output directory: `/`.
3. Deploy.

Live at `https://<project>.pages.dev`, redeploying on every push. `_headers` is applied
automatically.

## Option 3 — Netlify

1. https://app.netlify.com → **Add new site → Import an existing project** → pick `rtu`.
2. Build command: *empty*. Publish directory: `.` (already set by `netlify.toml`).
3. Deploy.

Live at `https://<site>.netlify.app`.

---

## Your own domain (the only part that costs money)

Hosting stays free on all three. A domain (e.g. `al-miftah.com`) costs roughly
US$10–15 a year from any registrar. Add it under the host's "Custom domain" settings;
HTTPS certificates are issued free and automatically by all three.

## What not to use for real traffic

`raw.githack.com` is fine for a quick look, but it is a courtesy proxy for developers:
it is slower, rate-limited, and shows an interstitial warning page. Do not share it
with users.

## Checking a deployment worked

Open the site and look under the search box for the grey pill:

> ⚡ Search index active (built …) · Shia corpus mirrored (32,531 hadith) · AI semantic search available

If that line is missing, the app could not reach the index — check that the `data`
branch exists and that the latest workflow run's "Publish index to data branch" step
succeeded.
