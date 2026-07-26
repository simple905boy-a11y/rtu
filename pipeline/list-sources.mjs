#!/usr/bin/env node
/* Prints every hadith collection and tafsir edition the free sources offer, so we
   can see what is actually addable before promising it. Run from the workflow of
   the same name; the answer appears in that run's log. */

const HADITH = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions.min.json";
const TAFSIR_CANDIDATES = [
  "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/editions.json",
  "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/editions.min.json",
  "https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir/editions.json"
];
const QURAN_EDITIONS = "https://api.alquran.cloud/v1/edition?format=text&type=translation";
const THAQALAYN_BOOKS = "https://www.thaqalayn-api.net/api/v2/allbooks";

const get = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

console.log("=".repeat(70));
console.log("HADITH COLLECTIONS (fawazahmed0/hadith-api)");
console.log("=".repeat(70));
try {
  const eds = await get(HADITH);
  for (const [key, val] of Object.entries(eds)) {
    const langs = (val.collection || [])
      .filter((c) => ["English", "Urdu", "Arabic"].includes(c.language))
      .map((c) => `${c.language}${c.hasbooks ? "" : ""}:${c.name}`);
    console.log(`\n${key}  —  ${val.name || ""}`);
    for (const l of langs) console.log(`    ${l}`);
  }
} catch (e) { console.log("! failed:", e.message); }

console.log("\n" + "=".repeat(70));
console.log("TAFSIR EDITIONS (spa5k/tafsir_api)");
console.log("=".repeat(70));
let done = false;
for (const url of TAFSIR_CANDIDATES) {
  if (done) break;
  try {
    const list = await get(url);
    const rows = Array.isArray(list) ? list : list.editions || [];
    for (const t of rows) {
      console.log(`${(t.slug || t.id || "?").padEnd(34)} ${(t.language_name || t.language || "").padEnd(10)} ${t.name || t.author_name || ""}`);
    }
    console.log(`(source: ${url}, ${rows.length} editions)`);
    done = true;
  } catch (e) { console.log(`  ${url} → ${e.message}`); }
}

console.log("\n" + "=".repeat(70));
console.log("QURAN TRANSLATIONS — Urdu & English (alquran.cloud)");
console.log("=".repeat(70));
try {
  const j = await get(QURAN_EDITIONS);
  for (const e of j.data || []) {
    if (["ur", "en"].includes(e.language)) {
      console.log(`${e.identifier.padEnd(22)} ${e.language}  ${e.englishName} — ${e.name}`);
    }
  }
} catch (e) { console.log("! failed:", e.message); }

console.log("\n" + "=".repeat(70));
console.log("QURAN.COM — Urdu translations & tafsirs (second source)");
console.log("=".repeat(70));
for (const [label, url] of [
  ["TRANSLATIONS", "https://api.quran.com/api/v4/resources/translations"],
  ["TAFSIRS", "https://api.quran.com/api/v4/resources/tafsirs"]
]) {
  try {
    const j = await get(url);
    const rows = j.translations || j.tafsirs || [];
    console.log(`\n-- ${label} (urdu/english only, of ${rows.length} total) --`);
    for (const t of rows) {
      const lang = t.language_name || "";
      if (!["urdu", "english"].includes(lang)) continue;
      console.log(`  id=${String(t.id).padEnd(5)} ${lang.padEnd(8)} ${t.name} — ${t.author_name || ""}`);
    }
  } catch (e) { console.log(`  ${label} failed: ${e.message}`); }
}

console.log("\n" + "=".repeat(70));
console.log("SHIA BOOKS (thaqalayn-api) — already fully mirrored");
console.log("=".repeat(70));
try {
  const raw = await get(THAQALAYN_BOOKS);
  const list = Array.isArray(raw) ? raw : raw.data || raw.books || [];
  for (const b of list) console.log(typeof b === "string" ? b : `${b.bookId || b.id}  —  ${b.BookName || b.name || ""}`);
} catch (e) { console.log("! failed:", e.message); }
