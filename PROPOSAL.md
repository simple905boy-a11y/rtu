# Al-Miftah — Proposal & Roadmap

**Goal:** a professional, smooth Islamic reference app where a user can search any topic
(e.g. *marriage*) and see hadith from **both Sunni and Shia collections side by side, each with
its exact reference and grading**, plus read **Qur'an tafsir from renowned scholars**.

---

## What is already built (Phase 1 — this repository)

A polished single-page web app with **no build step and no server** — it can be opened directly
or hosted free on GitHub Pages.

### Features
| Feature | Details |
|---|---|
| Cross-sect hadith search | One query searches Sunni collections (Sahih al-Bukhari, Sahih Muslim, Sunan Abu Dawud, Jami` at-Tirmidhi, Sunan an-Nasa'i, Sunan Ibn Majah, Muwatta Malik) **and** the Shia Thaqalayn corpus (Al-Kafi and other classical Twelver works) |
| Full references | Collection name, hadith number, book/chapter, plus a "View at source" link (sunnah.com / thaqalayn.net) and one-click **Copy citation** |
| Gradings shown transparently | Sunni gradings (Sahih/Hasan/Da'if by recorded scholars) and Shia gradings (al-Majlisi) rendered as colour-coded badges |
| School filter | All / Sunni / Shia chips, and a per-collection picker |
| **Urdu support** | Global EN/اردو toggle: hadith shown in Urdu (Nastaliq typography) with English beneath, Urdu Qur'an translation (Fateh Muhammad Jalandhry), and Urdu tafsirs — تفسیر ابنِ کثیر, بیان القرآن (Dr. Israr Ahmad), فی ظلال القرآن |
| **Smart search** | Islamic-term synonyms (nikah = marriage = شادی, zakat = charity = زکوٰۃ, ~45 concept groups), English stemming (orphans→orphan), typo correction against the corpus vocabulary (marrige→marriage), stop-word removal ("hadees about marriage"→"marriage"), cross-script matching (an Urdu query matches English texts and vice versa), relevance ranking with exact > synonym > corrected weighting |
| Qur'an & Tafsir reader | Any of the 6,236 verses with Arabic (Uthmani script), Saheeh International translation, and tafsir from **Ibn Kathir, Ma'ariful Qur'an (Mufti Shafi Usmani), Tazkirul Qur'an (Wahiduddin Khan)**, plus Arabic Ibn Kathir and al-Muyassar |
| Professional UX | Islamic green/gold design, Arabic typography (Amiri), dark mode, smooth animations, mobile responsive, verse prev/next navigation |
| Performance | Collections download once and are cached in the browser (Cache API); subsequent searches are instant and work like a local database |

### Data sources (all free, no API key)
| Source | Used for | Notes |
|---|---|---|
| [Hadith API (fawazahmed0)](https://github.com/fawazahmed0/hadith-api) via jsDelivr CDN | Sunni hadith + gradings | Static JSON, extremely reliable CDN |
| [Thaqalayn API](https://www.thaqalayn-api.net) (thaqalayn.net) | Shia hadith + Majlisi gradings | Community API; app degrades gracefully if it is down |
| [AlQuran.cloud](https://alquran.cloud) | Qur'an Arabic text + translation | |
| [Tafsir API (spa5k)](https://github.com/spa5k/tafsir_api) via jsDelivr CDN | Tafsir texts | Static JSON on CDN |

### Honest limitations of Phase 1
- Smart search uses a curated synonym dictionary + typo correction; it is not yet true
  semantic search (that needs embeddings — Phase 2/3) and has no Arabic-root morphology.
- Shia coverage depends on the community Thaqalayn API being online, and has no Urdu
  translation in the free source.
- Shia *tafsir* (e.g. al-Mizan by Allamah Tabataba'i) is not yet included — no free
  machine-readable source exists; it needs licensing/ingestion work (Phase 2).
- First search per collection downloads a few MB (then cached forever).

---

## Phase 2 — Proper search backend (recommended next step)
1. **Ingest all collections into one database** (PostgreSQL) with a normalized schema:
   `collection → book → chapter → hadith (arabic, english, urdu, grades[], refs[])`.
2. **Full-text search engine** (Meilisearch or Typesense — both open source):
   typo tolerance, synonyms (nikah = marriage, zakat = charity/alms), Arabic stemming,
   instant (<50 ms) results, relevance ranking.
3. **API layer** (FastAPI or Node/Express) with endpoints like
   `GET /search?q=marriage&sect=all&grade=sahih`.
4. Additional sources behind keys: **sunnah.com API** (official, richer metadata),
   Urdu translations, Nahj al-Balagha, Sahifa al-Sajjadiyya.
5. Cost: runs on a $5–10/month VPS or free tiers (Railway/Fly.io + Meilisearch Cloud free tier).

## Phase 3 — Mobile apps & accounts
- **Flutter** (one codebase → Android + iOS) reusing the Phase 2 API.
- Bookmarks, notes, reading history, offline collection packs, share-as-image cards.
- Optional: AI semantic search ("what does Islam say about treating parents?") using
  multilingual embeddings over the same database.

## Sensitivity principles (all phases)
- **Neutral presentation:** Sunni and Shia narrations are shown side by side without editorial
  judgement; each tradition's own grading system is displayed, clearly attributed.
- **Traceability:** every text links back to its source; nothing is shown without a reference.
- **Disclaimer:** the app is a study tool, not a fatwa service — stated in the footer.

---

## How to deploy Phase 1 right now
1. GitHub → repo **Settings → Pages → Deploy from branch** → select this branch, root folder.
2. The app is live at `https://<username>.github.io/rtu/` within a minute. No server, no cost.
