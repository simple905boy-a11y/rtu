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
- ✨ Dark mode, Arabic typography, mobile-friendly, smooth animations. No login, no tracking.

## Run it

No build step, no server, no API keys.

```bash
# any static server works, e.g.:
python3 -m http.server 8000
# then open http://localhost:8000
```

Or deploy free on **GitHub Pages**: Settings → Pages → Deploy from branch → this branch, `/ (root)`.

> Note: the app fetches its texts from public sources over the internet
> (jsDelivr CDN, AlQuran.cloud, thaqalayn-api.net), so it needs to be online.
> Collections are cached in the browser after first use, making repeat searches instant.

## Project structure

```
index.html        app shell (two tabs: Hadith Search, Qur'an & Tafsir)
css/style.css     design system (light/dark, Islamic green & gold)
js/sources.js     data-source configuration (collections, tafsir editions)
js/quran-meta.js  surah names + verse counts
js/app.js         search engine, caching, rendering
PROPOSAL.md       full roadmap (backend search, mobile apps, more sources)
```

## Disclaimer

Texts come from open community-maintained sources. Gradings shown are those recorded by each
source. This is a study tool, not a fatwa service — for religious rulings consult qualified
scholars and verified printed editions.
