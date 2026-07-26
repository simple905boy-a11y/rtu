#!/usr/bin/env node
/* ================= Al-Miftah index builder =================
   Runs in GitHub Actions (free) — never in the user's browser.

   1. Downloads every Sunni collection (Hadith API CDN) to count/align docs.
   2. Mirrors the Shia Thaqalayn corpus into static JSON, so the live app
      no longer depends on the community API being up.
   3. Computes semantic embeddings (all-MiniLM-L6-v2, quantized) for every
      hadith and stores them as compact int8 binary shards.

   Output layout (consumed by the web app, which auto-detects it):
     <out>/manifest.json
     <out>/shia.json
     <out>/vectors/<collection>.bin

   Flags:
     --out DIR            output directory (default ../data)
     --collections a,b    limit Sunni collections (testing)
     --no-embed           skip embeddings entirely
     --mock-embed         deterministic hash embeddings (testing, no model)
     --fixtures DIR       read JSON from DIR/<url-basename> instead of network
*/
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, basename } from "node:path";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };

const OUT = opt("--out", "../data");
const FIXTURES = opt("--fixtures", null);
const NO_EMBED = flag("--no-embed");
const MOCK_EMBED = flag("--mock-embed");
const ONLY = opt("--collections", null)?.split(",");

const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";
const THAQ = "https://www.thaqalayn-api.net/api/v2";
const DIM = 384;

const SUNNI = ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai", "ibnmajah", "malik"]
  .filter((id) => !ONLY || ONLY.includes(id));

async function getJSON(url) {
  if (FIXTURES) {
    let name = basename(new URL(url).pathname);
    if (!name.endsWith(".json")) name += ".json";
    return JSON.parse(await readFile(join(FIXTURES, name), "utf8"));
  }
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (attempt >= 3) throw new Error(`${url}: ${e.message}`);
      await new Promise((res) => setTimeout(res, 2 ** attempt * 1000));
    }
  }
}

/* ---------- embeddings ---------- */
function mockEmbed(text) {
  // Deterministic bag-of-words hash vector; used only by tests.
  const v = new Float32Array(DIM);
  for (const tok of (text || "").toLowerCase().split(/[^a-z؀-ۿ]+/)) {
    if (!tok) continue;
    let h = 0;
    for (const c of tok) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    v[h % DIM] += 1;
  }
  return normalizeVec(v);
}
function normalizeVec(v) {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= n;
  return v;
}

async function makeEmbedder() {
  if (MOCK_EMBED) return async (text) => mockEmbed(text);
  const { pipeline, env } = await import("@xenova/transformers");
  env.allowLocalModels = false;
  const fe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { quantized: true });
  return async (text) => {
    const r = await fe((text || "").slice(0, 600) || " ", { pooling: "mean", normalize: true });
    return Float32Array.from(r.data);
  };
}

function quantize(vec) {
  const q = new Int8Array(vec.length);
  for (let i = 0; i < vec.length; i++) q[i] = Math.max(-127, Math.min(127, Math.round(vec[i] * 127)));
  return q;
}

async function embedCollection(embed, texts, label) {
  const bin = new Int8Array(texts.length * DIM);
  for (let i = 0; i < texts.length; i++) {
    bin.set(quantize(await embed(texts[i])), i * DIM);
    if ((i + 1) % 500 === 0 || i + 1 === texts.length) {
      console.log(`  ${label}: embedded ${i + 1}/${texts.length}`);
    }
  }
  return bin;
}

/* ---------- Shia corpus mirror ---------- */
function normalizeShiaRow(h, bookName) {
  const grade = h.majlisiGrading || h.behbudiGrading || h.mohseniGrading || null;
  return {
    collection: h.book || bookName,
    number: h.number ?? h.hadithNumber ?? h.id ?? "",
    book: h.volume ?? null,
    chapter: h.chapter ?? h.chapterInCategory ?? null,
    category: h.category ?? null,
    text: h.englishText || h.english || h.translation || "",
    arabic: h.arabicText || h.arabic || "",
    grades: grade ? [{ by: "al-Majlisi", grade }] : [],
    link: h.URL || h.url || "https://thaqalayn.net"
  };
}

async function buildShia() {
  const raw = await getJSON(`${THAQ}/allbooks`);
  const list = (Array.isArray(raw) ? raw : raw.data || raw.books || []).map((b) =>
    typeof b === "string"
      ? { id: b, name: b }
      : { id: b.bookId || b.id || b.book, name: b.BookName || b.name || b.bookId || b.id }
  ).filter((b) => b.id);
  console.log(`Shia: ${list.length} books listed`);

  const docs = [];
  const bookNames = [];
  for (const book of list) {
    try {
      const rows = await getJSON(`${THAQ}/${encodeURIComponent(book.id)}`);
      const arr = Array.isArray(rows) ? rows : rows.data || [];
      let added = 0;
      for (const h of arr) {
        const doc = normalizeShiaRow(h, book.name);
        if (doc.text) { docs.push(doc); added++; }
      }
      if (added) bookNames.push(book.name);
      console.log(`  ${book.id}: ${added} hadith`);
    } catch (e) {
      console.warn(`  ! skipping ${book.id}: ${e.message}`);
    }
  }
  return { docs, bookNames };
}

/* ---------- main ---------- */
const manifest = { built: new Date().toISOString(), dim: DIM, embeddings: !NO_EMBED, collections: {}, shia: null };
await mkdir(join(OUT, "vectors"), { recursive: true });

let embed = null;
if (!NO_EMBED) {
  try {
    embed = await makeEmbedder();
  } catch (e) {
    console.warn(`! Embedding model unavailable (${e.message}) — building without embeddings.`);
    manifest.embeddings = false;
  }
}

for (const id of SUNNI) {
  console.log(`Sunni: fetching eng-${id}…`);
  try {
    const data = await getJSON(`${CDN}/eng-${id}.min.json`);
    const hadiths = data.hadiths || [];
    manifest.collections[id] = { count: hadiths.length };
    if (embed) {
      const bin = await embedCollection(embed, hadiths.map((h) => h.text), id);
      await writeFile(join(OUT, "vectors", `${id}.bin`), Buffer.from(bin.buffer));
    }
  } catch (e) {
    console.warn(`! skipping ${id}: ${e.message}`);
  }
}

try {
  const { docs, bookNames } = await buildShia();
  if (docs.length) {
    await writeFile(join(OUT, "shia.json"), JSON.stringify({ docs }));
    manifest.shia = { count: docs.length, books: bookNames };
    manifest.collections.shia = { count: docs.length };
    if (embed) {
      const bin = await embedCollection(embed, docs.map((d) => d.text), "shia");
      await writeFile(join(OUT, "vectors", "shia.bin"), Buffer.from(bin.buffer));
    }
  }
} catch (e) {
  console.warn(`! Shia mirror failed entirely (${e.message}) — app will fall back to the live API.`);
}

await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("Done:", JSON.stringify(manifest.collections));
