# Al-Miftah 🕌 — Hadith Search & Qur'an Tafsir

A professional, fast Islamic reference web app:

- 🔍 **Search hadith across schools** — one query (e.g. *marriage*) returns narrations from
  Sunni collections (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah, Muwatta Malik)
  **and** Shia collections (Al-Kafi & the Thaqalayn corpus), side by side.
- 📖 **Every result carries its full reference** — collection, hadith number, book/chapter,
  scholarly grading (Sahih / Hasan / Da'if, Majlisi gradings), a link to the original source,
  and a one-click copy-citation button.
- 🕋 **Qur'an & Tafsir reader** — any verse with Arabic text, English translation, and
  commentary from renowned scholars: **Ibn Kathir, Ma'ariful Qur'an (Mufti Shafi Usmani),
  Tazkirul Qur'an (Wahiduddin Khan)** and Arabic tafsirs.
- 🇵🇰 **Urdu mode (اردو)** — one toggle switches hadith text to Urdu (Nastaliq script),
  the Qur'an translation to Fateh Muhammad Jalandhry, and offers Urdu tafsirs
  (تفسیر ابنِ کثیر، بیان القرآن، فی ظلال القرآن).
- 🧠 **Smart search** — understands synonyms (*nikah = marriage = شادی*), fixes typos
  (*marrige → marriage*), stems plurals, ignores filler words, and matches across
  scripts: search in English or Urdu, find results in both.
- 🤖 **AI semantic search** (no server, still free) — a GitHub Action pre-computes an
  embedding for every hadith with an open-source model (all-MiniLM-L6-v2); the app embeds
  your question in the browser and ranks results **by meaning**, so
  *"treating parents kindly"* finds hadith that use none of those words. It also mirrors
  the whole Shia corpus as static files, so results no longer depend on a third-party
  API being online.
- ✨ Dark mode, Arabic typography, mobile-friendly, smooth animations. No login, no tracking.

## Run it

No build step, no server, no API keys.

```bash
# any static server works, e.g.:
python3 -m http.server 8000
# then open http://localhost:8000
```

### Deploy free on GitHub Pages (recommended — enables AI search)

1. Repo **Settings → Pages → Source: GitHub Actions**.
2. Run the **"Build search index & deploy site"** workflow (Actions tab → Run workflow),
   or just push to the branch — it runs automatically.
3. The workflow downloads all collections, mirrors the Shia corpus, computes semantic
   embeddings (takes a while on the first run), and deploys everything to
   `https://<username>.github.io/rtu/`. It re-runs monthly to stay current.

Without the workflow (e.g. opening `index.html` locally) the app still fully works —
it just uses live CDN/API sources and hides the AI toggle.

> Note: the app fetches its texts from public sources over the internet
> (jsDelivr CDN, AlQuran.cloud, thaqalayn-api.net), so it needs to be online.
> Collections are cached in the browser after first use, making repeat searches instant.

## Project structure

```
index.html        app shell (two tabs: Hadith Search, Qur'an & Tafsir)
css/style.css     design system (light/dark, Islamic green & gold)
js/sources.js     data-source configuration (collections, tafsir editions, translations)
js/quran-meta.js  surah names + verse counts
js/search-smart.js synonym/typo/stemming query engine
js/search-semantic.js in-browser query embedding + vector ranking
js/app.js         app logic, caching, rendering
pipeline/build.mjs index builder (Shia mirror + embeddings), runs in GitHub Actions
.github/workflows/build-index.yml free scheduled build + Pages deploy
PROPOSAL.md       full roadmap (backend search, mobile apps, more sources)
```

## Disclaimer

Texts come from open community-maintained sources. Gradings shown are those recorded by each
source. This is a study tool, not a fatwa service — for religious rulings consult qualified
scholars and verified printed editions.
