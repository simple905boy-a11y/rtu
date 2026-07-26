/* ================= Al-Miftah — application logic ================= */
"use strict";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

/* ---------------- language ---------------- */
let appLang = localStorage.getItem("almiftah-lang") || "en";

function applyLang() {
  $$(".lang-toggle button").forEach((b) => b.classList.toggle("active", b.dataset.lang === appLang));
}
function initLang() {
  applyLang();
  $$(".lang-toggle button").forEach((b) =>
    b.addEventListener("click", () => {
      if (appLang === b.dataset.lang) return;
      appLang = b.dataset.lang;
      localStorage.setItem("almiftah-lang", appLang);
      applyLang();
      pickDefaultTafsirForLang();
      if (hadithState.lastQuery) runSearch(hadithState.lastQuery);
      if (tafsirState.loaded) loadTafsir();
    })
  );
}

/* ---------------- theme + tabs ---------------- */
(function initChrome() {
  const saved = localStorage.getItem("almiftah-theme");
  if (saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.dataset.theme = "dark";
  }
  $("#theme-toggle").addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme === "dark";
    document.documentElement.dataset.theme = dark ? "" : "dark";
    localStorage.setItem("almiftah-theme", dark ? "light" : "dark");
  });

  $$(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => { t.classList.toggle("active", t === tab); t.setAttribute("aria-selected", t === tab); });
      $$(".panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + tab.dataset.tab));
    })
  );
})();

/* ---------------- cached fetch (one-time downloads) ---------------- */
async function cachedFetchJSON(url, onProgress) {
  let cache = null;
  try { cache = await caches.open("almiftah-v1"); } catch { /* file:// or private mode */ }
  if (cache) {
    const hit = await cache.match(url);
    if (hit) return hit.json();
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

  // Stream so we can show download progress on large collection files.
  const total = +res.headers.get("Content-Length") || 0;
  if (res.body && onProgress && total) {
    const reader = res.body.getReader();
    const chunks = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      onProgress(received / total);
    }
    const blob = new Blob(chunks);
    if (cache) await cache.put(url, new Response(blob, { headers: { "Content-Type": "application/json" } }));
    return JSON.parse(await blob.text());
  }
  const text = await res.text();
  if (cache) await cache.put(url, new Response(text, { headers: { "Content-Type": "application/json" } }));
  return JSON.parse(text);
}

/* ================================================================
   HADITH SEARCH
   ================================================================ */
const hadithState = {
  sect: "all",
  editions: new Map(),   // colId -> { hadiths, urdu: Map|null, urduStatus: "none"|"loaded"|"unavailable" }
  lastQuery: ""
};

/* ---------- pro index (built by GitHub Action; auto-detected) ---------- */
// Preferred: an index deployed next to the app (GitHub Pages). Fallback: the same
// index published to the repo's `data` branch and served by the free jsDelivr CDN,
// which lets the app run from anywhere — including a local file — with no hosting.
let DATA_BASE = "data";
const CDN_DATA_BASE = "https://cdn.jsdelivr.net/gh/simple905boy-a11y/rtu@data";
const proState = { manifest: null, shiaDocs: null, semantic: false, viaCdn: false };

async function initPro() {
  for (const base of [DATA_BASE, CDN_DATA_BASE]) {
    try {
      const r = await fetch(`${base}/manifest.json`, { cache: "no-store" });
      if (!r.ok) continue;
      proState.manifest = await r.json();
      DATA_BASE = base;
      proState.viaCdn = base === CDN_DATA_BASE;
      break;
    } catch { /* try the next source */ }
  }
  if (!proState.manifest) return;
  const m = proState.manifest;
  const toggle = $("#semantic-toggle");
  if (m.embeddings) toggle.hidden = false;
  const badge = document.createElement("div");
  badge.className = "pro-badge";
  badge.innerHTML = `⚡ Search index active (built ${new Date(m.built).toLocaleDateString()})` +
    (m.shia ? ` · Shia corpus mirrored (${m.shia.count.toLocaleString()} hadith)` : "") +
    (m.embeddings ? " · AI semantic search available" : "") +
    (proState.viaCdn ? " · served via jsDelivr CDN" : "");
  $("#panel-hadith .search-hero").appendChild(badge);
}

$("#semantic-toggle").addEventListener("click", () => {
  proState.semantic = !proState.semantic;
  const t = $("#semantic-toggle");
  t.classList.toggle("active", proState.semantic);
  t.textContent = `🧠 AI Semantic: ${proState.semantic ? "on" : "off"}`;
  $("#search-input").placeholder = proState.semantic
    ? "Ask by meaning… e.g. “treating parents kindly”"
    : "Search hadith… (English or اردو, e.g. “marriage”)";
  if (hadithState.lastQuery) runSearch(hadithState.lastQuery);
});

async function ensureShiaLocal() {
  if (proState.shiaDocs) return proState.shiaDocs;
  const shards = proState.manifest?.shia?.shards || ["shia.json"];
  const docs = [];
  for (let i = 0; i < shards.length; i++) {
    setStatus(`Loading Shia corpus (part ${i + 1} of ${shards.length}, one-time — cached for future searches)…`);
    const data = await cachedFetchJSON(`${DATA_BASE}/${shards[i]}`);
    docs.push(...(data.docs || []));
  }
  proState.shiaDocs = docs;
  feedVocabulary(docs.map((d) => d.text));
  return docs;
}

/* ---------- collections picker ---------- */
function renderCollectionsPicker() {
  const list = $("#collections-list");
  let html = "<h4>Sunni collections</h4>";
  for (const c of SUNNI_COLLECTIONS) {
    html += `<label><input type="checkbox" data-col="${c.id}" ${c.default ? "checked" : ""}/>
      ${c.name} <span class="col-size">${c.size}</span></label>`;
  }
  html += `<h4>Shia collections</h4>
    <label><input type="checkbox" data-col="thaqalayn" checked />
      Thaqalayn corpus (Al-Kafi &amp; other classical works) <span class="col-size">online</span></label>`;
  list.innerHTML = html;
  list.addEventListener("change", updateCollectionsCount);
  updateCollectionsCount();
}
function selectedSunni() {
  return SUNNI_COLLECTIONS.filter((c) => $(`[data-col="${c.id}"]`)?.checked);
}
function shiaSelected() {
  return $(`[data-col="thaqalayn"]`)?.checked;
}
function updateCollectionsCount() {
  const n = selectedSunni().length + (shiaSelected() ? 1 : 0);
  $("#collections-count").textContent = `(${n})`;
}

/* ---------- sect filter ---------- */
$$(".sect-filter .chip").forEach((chip) =>
  chip.addEventListener("click", () => {
    $$(".sect-filter .chip").forEach((c) => c.classList.toggle("active", c === chip));
    hadithState.sect = chip.dataset.sect;
    if (hadithState.lastQuery) runSearch(hadithState.lastQuery);
  })
);

$$(".example-chip").forEach((b) =>
  b.addEventListener("click", () => {
    $("#search-input").value = b.dataset.q;
    runSearch(b.dataset.q);
  })
);

$("#search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("#search-input").value.trim();
  if (q) runSearch(q);
});

/* ---------- status helpers ---------- */
function setStatus(msg, progress = null) {
  const el = $("#load-status");
  if (msg === null) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<div>${msg}</div>` + (progress !== null ? `<div class="bar"><div style="width:${Math.round(progress * 100)}%"></div></div>` : "");
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function escapeHtml(s) {
  return (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function highlight(text, terms) {
  let out = escapeHtml(text);
  for (const term of terms) {
    if (term.length < 3) continue;
    out = out.replace(new RegExp(`(${escapeRe(term)})`, "gi"), "<mark>$1</mark>");
  }
  return out;
}

/* ---------- Sunni: load + search ---------- */
async function ensureEdition(col) {
  let entry = hadithState.editions.get(col.id);
  if (!entry) {
    const url = `${HADITH_CDN}/${col.edition}.min.json`;
    setStatus(`Downloading <strong>${col.name}</strong> (one-time, ${col.size} — cached for future searches)…`, 0);
    const data = await cachedFetchJSON(url, (p) => setStatus(`Downloading <strong>${col.name}</strong> (one-time, ${col.size})…`, p));
    entry = { hadiths: data.hadiths || [], urdu: null, urduStatus: "none" };
    hadithState.editions.set(col.id, entry);
    feedVocabulary(entry.hadiths.map((h) => h.text));
  }
  return entry;
}

async function ensureUrdu(col, entry) {
  if (entry.urduStatus !== "none") return;
  try {
    const url = `${HADITH_CDN}/${col.urduEdition}.min.json`;
    setStatus(`Downloading <strong>${col.name}</strong> اردو ترجمہ (one-time, cached)…`, 0);
    const data = await cachedFetchJSON(url, (p) => setStatus(`Downloading <strong>${col.name}</strong> اردو ترجمہ…`, p));
    entry.urdu = new Map((data.hadiths || []).map((h) => [String(h.hadithnumber), h.text]));
    entry.urduStatus = "loaded";
  } catch {
    entry.urduStatus = "unavailable"; // e.g. Urdu edition not published for this collection
  }
}

function scoreSunni(entry, expanded, useUrdu) {
  const out = [];
  const hs = entry.hadiths;
  for (let i = 0; i < hs.length; i++) {
    const h = hs[i];
    if (h._n === undefined) h._n = smartNormalize(h.text);
    let urduText = null;
    if (useUrdu && entry.urdu) {
      urduText = entry.urdu.get(String(h.hadithnumber)) || null;
      if (urduText && h._nu === undefined) h._nu = smartNormalize(urduText);
    }
    const s = smartMatch([h._n, urduText ? h._nu : null], expanded);
    if (s > 0) out.push({ idx: i, kw: s });
  }
  return out;
}

function buildSunniHit(col, entry, idx, score, sim, useUrdu) {
  const h = entry.hadiths[idx];
  return {
    score,
    sim,
    collection: appLang === "ur" ? col.urduName : col.name,
    colId: col.id,
    number: h.hadithnumber,
    book: h.reference ? h.reference.book : null,
    inBookRef: h.reference ? h.reference.hadith : null,
    text: h.text,
    urdu: useUrdu && entry.urdu ? entry.urdu.get(String(h.hadithnumber)) || null : null,
    grades: (h.grades || []).map((g) => ({ by: g.name, grade: g.grade })),
    link: `https://sunnah.com/${col.sunnahSlug}:${h.hadithnumber}`
  };
}

/* Blend keyword and semantic scores; a doc surfacing on either channel is kept. */
const MAX_HITS_PER_COLLECTION = 200;
function mergeScores(kwArr, semMap) {
  const m = new Map(kwArr.map((r) => [r.idx, { kw: r.kw, cos: 0 }]));
  if (semMap) {
    for (const [idx, cos] of semMap) {
      const e = m.get(idx);
      if (e) e.cos = cos;
      else m.set(idx, { kw: 0, cos });
    }
  }
  return [...m.entries()]
    .map(([idx, { kw, cos }]) => ({ idx, score: kw + cos * 60, sim: cos }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_HITS_PER_COLLECTION);
}

/* ---------- Shia: local mirror (pro index) or live Thaqalayn API ---------- */
function scoreShiaLocal(docs, expanded) {
  const out = [];
  for (let i = 0; i < docs.length; i++) {
    const d = docs[i];
    if (d._n === undefined) d._n = smartNormalize(d.text);
    if (d._na === undefined) d._na = smartNormalize(d.arabic);
    const s = smartMatch([d._n, d._na], expanded);
    if (s > 0) out.push({ idx: i, kw: s });
  }
  return out;
}
function buildShiaHit(docs, idx, score, sim) {
  return { ...docs[idx], colId: "thaqalayn", score, sim };
}

async function searchShia(query) {
  const url = `${THAQALAYN_API}/query?q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Thaqalayn API HTTP ${res.status}`);
  const json = await res.json();
  const rows = Array.isArray(json) ? json : json.data || json.results || [];
  return rows.map((h) => ({
    score: 1,
    collection: h.book || h.bookId || "Thaqalayn collection",
    colId: "thaqalayn",
    number: h.number || h.hadithNumber || h.id || "",
    book: h.volume || null,
    chapter: h.chapter || h.chapterInCategory || null,
    category: h.category || null,
    text: h.englishText || h.english || h.translation || "",
    arabic: h.arabicText || h.arabic || "",
    grades: (h.majlisiGrading || h.behbudiGrading || h.mohseniGrading)
      ? [{ by: "al-Majlisi", grade: h.majlisiGrading || h.behbudiGrading || h.mohseniGrading }]
      : [],
    link: h.URL || h.url || "https://thaqalayn.net"
  })).filter((h) => h.text);
}

/* ---------- run a search ---------- */
let searchToken = 0;
async function runSearch(query) {
  hadithState.lastQuery = query;
  const token = ++searchToken;
  const resultsEl = $("#results");
  const summaryEl = $("#results-summary");
  resultsEl.innerHTML = `<div class="spinner"></div>`;
  summaryEl.hidden = true;

  const wantSunni = hadithState.sect !== "shia";
  const wantShia = hadithState.sect !== "sunni" && shiaSelected();
  const useUrdu = appLang === "ur" || isArabicScript(query);

  const sunniGroups = [];
  const errors = [];
  let expanded = expandQuery(query); // pre-vocabulary pass (synonyms work immediately)

  // Semantic channel: embed the query in-browser (only when toggled on and the index exists).
  let qvec = null;
  if (proState.semantic && proState.manifest?.embeddings) {
    try {
      qvec = await semQueryVec(query, (m) => setStatus(m));
    } catch (e) {
      errors.push(`AI semantic engine could not load (${e.message}) — showing keyword results only.`);
    }
    if (token !== searchToken) return;
  }

  async function semanticFor(colId, count) {
    if (!qvec || !proState.manifest?.collections?.[colId]) return null;
    try {
      const vectors = await semVectors(DATA_BASE, colId, count);
      return semTop(vectors, qvec);
    } catch (e) {
      errors.push(`Semantic index for ${colId} unavailable: ${e.message}`);
      return null;
    }
  }

  if (wantSunni) {
    for (const col of selectedSunni()) {
      try {
        const entry = await ensureEdition(col);
        if (useUrdu) await ensureUrdu(col, entry);
        if (token !== searchToken) return; // superseded by a newer search
        expanded = expandQuery(query);     // re-expand now that vocabulary includes this corpus
        const kw = scoreSunni(entry, expanded, useUrdu);
        const sem = await semanticFor(col.id, entry.hadiths.length);
        const merged = mergeScores(kw, sem);
        const hits = merged.map((m) => buildSunniHit(col, entry, m.idx, m.score, m.sim, useUrdu));
        if (hits.length) sunniGroups.push({ col, hits, urduMissing: useUrdu && entry.urduStatus === "unavailable" });
      } catch (e) {
        errors.push(`Could not load ${col.name}: ${e.message}`);
      }
    }
  }

  let shiaHits = [];
  if (wantShia) {
    if (proState.manifest?.shia) {
      try {
        const docs = await ensureShiaLocal();
        if (token !== searchToken) return;
        expanded = expandQuery(query);
        const kw = scoreShiaLocal(docs, expanded);
        const sem = await semanticFor("shia", docs.length);
        shiaHits = mergeScores(kw, sem).map((m) => buildShiaHit(docs, m.idx, m.score, m.sim));
      } catch (e) {
        errors.push(`Could not load the local Shia corpus: ${e.message}`);
      }
    } else {
      setStatus("Searching Shia collections via Thaqalayn…");
      try {
        // Ask the API with the primary term, then re-rank with the smart matcher
        // (matches English text and, for Urdu/Arabic-script queries, the Arabic original).
        shiaHits = await searchShia(expanded.tokens[0] || query);
        shiaHits = shiaHits
          .map((h) => ({ ...h, score: smartMatch([smartNormalize(h.text), smartNormalize(h.arabic)], expanded) }))
          .filter((h) => h.score > 0)
          .sort((a, b) => b.score - a.score);
      } catch (e) {
        errors.push(`Shia source (thaqalayn-api.net) is unreachable right now — please retry shortly. (${e.message})`);
      }
    }
  }
  if (token !== searchToken) return;
  setStatus(null);

  renderResults({ query, expanded, sunniGroups, shiaHits, errors, useUrdu });
}

const PAGE = 5;
function renderResults({ query, expanded, sunniGroups, shiaHits, errors, useUrdu }) {
  const resultsEl = $("#results");
  const summaryEl = $("#results-summary");
  const terms = allVariantTerms(expanded);
  const totalSunni = sunniGroups.reduce((n, g) => n + g.hits.length, 0);
  const total = totalSunni + shiaHits.length;

  summaryEl.hidden = false;
  let summaryHtml = `${total} narration${total === 1 ? "" : "s"} found for “${escapeHtml(query)}” — ${totalSunni} Sunni · ${shiaHits.length} Shia`;
  for (const c of expanded.corrections) {
    summaryHtml += `<div class="smart-note">Corrected “${escapeHtml(c.from)}” → “${escapeHtml(c.to)}”.</div>`;
  }
  if (expanded.synonymsUsed.length) {
    summaryHtml += `<div class="smart-note">Smart search also matched: ${expanded.synonymsUsed.slice(0, 10).map(escapeHtml).join(", ")}</div>`;
  }
  summaryEl.innerHTML = summaryHtml;

  resultsEl.innerHTML = "";

  for (const err of errors) {
    const div = document.createElement("div");
    div.className = "source-error";
    div.textContent = "⚠ " + err;
    resultsEl.appendChild(div);
  }

  if (hadithState.sect !== "shia") {
    const sect = sectionEl("Sunni collections", "sunni");
    if (sunniGroups.length === 0) sect.appendChild(emptyEl("No matches in the selected Sunni collections."));
    for (const g of sunniGroups) {
      appendGroup(sect, `${g.col.name} — ${g.hits.length} match${g.hits.length === 1 ? "" : "es"}`, g.hits, terms);
      if (g.urduMissing) sect.appendChild(emptyEl(`اردو ترجمہ ${g.col.name} کے لیے دستیاب نہیں — showing English.`));
    }
    resultsEl.appendChild(sect);
  }

  if (hadithState.sect !== "sunni") {
    const sect = sectionEl("Shia collections", "shia");
    if (!shiaSelected()) sect.appendChild(emptyEl("Shia collections are unchecked in the Collections menu."));
    else if (shiaHits.length === 0 && !errors.some((e) => e.includes("thaqalayn"))) sect.appendChild(emptyEl("No matches in the Shia corpus."));
    if (shiaHits.length) {
      appendGroup(sect, `Thaqalayn corpus — ${shiaHits.length} match${shiaHits.length === 1 ? "" : "es"}`, shiaHits, terms);
      if (useUrdu) sect.appendChild(emptyEl("اردو ترجمہ شیعہ مجموعوں کے لیے ابھی دستیاب نہیں — showing English & Arabic."));
    }
    resultsEl.appendChild(sect);
  }
}

function sectionEl(title, sectClass) {
  const div = document.createElement("div");
  div.className = "sect-group";
  div.innerHTML = `<h3><span class="sect-badge ${sectClass}">${sectClass}</span> ${title}</h3>`;
  return div;
}
function emptyEl(msg) {
  const div = document.createElement("div");
  div.className = "no-results";
  div.textContent = msg;
  return div;
}

function appendGroup(parent, heading, hits, terms) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<h4 style="margin:14px 0 10px;font-size:.9rem;color:var(--ink-soft)">${escapeHtml(heading)}</h4>`;
  const listEl = document.createElement("div");
  wrap.appendChild(listEl);
  let shown = 0;

  const showMore = document.createElement("button");
  showMore.className = "btn-ghost show-more";

  function renderPage() {
    const next = hits.slice(shown, shown + PAGE);
    for (const h of next) listEl.appendChild(hadithCard(h, terms));
    shown += next.length;
    if (shown >= hits.length) showMore.remove();
    else showMore.textContent = `Show ${Math.min(PAGE, hits.length - shown)} more of ${hits.length - shown} remaining`;
  }
  showMore.addEventListener("click", renderPage);
  renderPage();
  if (shown < hits.length) wrap.appendChild(showMore);
  parent.appendChild(wrap);
}

function gradeClass(grade) {
  const g = (grade || "").toLowerCase();
  if (g.includes("sahih") || g.includes("saheeh") || g.includes("authentic")) return "grade-sahih";
  if (g.includes("hasan") || g.includes("good") || g.includes("reliable")) return "grade-hasan";
  if (g.includes("da'if") || g.includes("daif") || g.includes("weak")) return "grade-daif";
  return "grade-other";
}

function hadithCard(h, terms) {
  const card = document.createElement("article");
  card.className = "hadith-card";

  const refParts = [`<span class="ref-main">${escapeHtml(h.collection)}${h.number !== "" ? " " + escapeHtml(String(h.number)) : ""}</span>`];
  if (h.book != null) refParts.push(`<span class="ref-tag">Book ${escapeHtml(String(h.book))}${h.inBookRef != null ? ", Hadith " + escapeHtml(String(h.inBookRef)) : ""}</span>`);
  if (h.chapter) refParts.push(`<span class="ref-tag">${escapeHtml(String(h.chapter))}</span>`);
  if (h.category) refParts.push(`<span class="ref-tag">${escapeHtml(String(h.category))}</span>`);
  for (const g of h.grades.slice(0, 3)) {
    refParts.push(`<span class="grade-tag ${gradeClass(g.grade)}" title="Graded by ${escapeHtml(g.by || "source")}">${escapeHtml(g.grade || "")}${g.by ? " — " + escapeHtml(g.by) : ""}</span>`);
  }
  if (h.sim > 0.3) refParts.push(`<span class="ref-tag sim-tag" title="Semantic similarity to your query">🧠 ${Math.round(h.sim * 100)}% meaning</span>`);

  const citation = `${h.collection}${h.number !== "" ? " " + h.number : ""}${h.book != null ? ` (Book ${h.book}${h.inBookRef != null ? ", Hadith " + h.inBookRef : ""})` : ""}`;

  const urduBlock = h.urdu && appLang === "ur"
    ? `<div class="hadith-urdu">${highlight(truncate(h.urdu, 900), terms)}</div>`
    : "";
  const englishBlock = `<div class="hadith-text ${appLang === "ur" && h.urdu ? "muted secondary-text" : ""}">${highlight(truncate(h.text, 900), terms)}</div>`;

  card.innerHTML = `
    <div class="hadith-ref">${refParts.join("")}</div>
    ${urduBlock}${englishBlock}
    ${h.arabic ? `<div class="hadith-arabic">${escapeHtml(truncate(h.arabic, 700))}</div>` : ""}
    <div class="hadith-actions">
      <a href="${escapeHtml(h.link)}" target="_blank" rel="noopener">View at source ↗</a>
      <button type="button" class="copy-cite">Copy citation</button>
    </div>`;

  card.querySelector(".copy-cite").addEventListener("click", (e) => {
    const body = appLang === "ur" && h.urdu ? h.urdu : h.text;
    navigator.clipboard.writeText(`"${body}" — ${citation}`).then(() => {
      e.target.textContent = "Copied ✓";
      setTimeout(() => (e.target.textContent = "Copy citation"), 1500);
    });
  });
  return card;
}
function truncate(s, n) { return s && s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + " …" : s; }

/* ================================================================
   QUR'AN & TAFSIR
   ================================================================ */
const tafsirState = { loaded: false };

function initTafsirControls() {
  const surahSel = $("#surah-select");
  surahSel.innerHTML = SURAHS.map((s, i) => `<option value="${i + 1}">${i + 1}. ${s[0]} — ${s[1]}</option>`).join("");
  surahSel.addEventListener("change", fillAyahSelect);

  const tafsirSel = $("#tafsir-select");
  let html = "";
  for (const lang of ["en", "ur", "ar"]) {
    const eds = TAFSIR_EDITIONS.filter((t) => t.lang === lang);
    if (!eds.length) continue;
    html += `<optgroup label="${TAFSIR_GROUP_LABELS[lang]}">` +
      eds.map((t) => `<option value="${t.slug}">${t.name}</option>`).join("") + `</optgroup>`;
  }
  tafsirSel.innerHTML = html;
  pickDefaultTafsirForLang();

  fillAyahSelect();
  $("#load-tafsir").addEventListener("click", loadTafsir);
  $("#prev-ayah").addEventListener("click", () => stepAyah(-1));
  $("#next-ayah").addEventListener("click", () => stepAyah(1));
}
function pickDefaultTafsirForLang() {
  const sel = $("#tafsir-select");
  if (!sel || !sel.options.length) return;
  const current = TAFSIR_EDITIONS.find((t) => t.slug === sel.value);
  if (current && current.lang === appLang) return; // user's pick already fits the language
  const def = TAFSIR_EDITIONS.find((t) => (appLang === "ur" ? t.urduDefault : t.default)) || TAFSIR_EDITIONS[0];
  sel.value = def.slug;
}
function fillAyahSelect() {
  const surah = +$("#surah-select").value;
  const count = SURAHS[surah - 1][2];
  $("#ayah-select").innerHTML = Array.from({ length: count }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("");
}
function stepAyah(delta) {
  const surahSel = $("#surah-select");
  const ayahSel = $("#ayah-select");
  let surah = +surahSel.value, ayah = +ayahSel.value + delta;
  if (ayah < 1) {
    if (surah === 1) return;
    surah -= 1; surahSel.value = surah; fillAyahSelect();
    ayah = SURAHS[surah - 1][2];
  } else if (ayah > SURAHS[surah - 1][2]) {
    if (surah === 114) return;
    surah += 1; surahSel.value = surah; fillAyahSelect();
    ayah = 1;
  }
  ayahSel.value = ayah;
  loadTafsir();
}

async function loadTafsir() {
  tafsirState.loaded = true;
  const surah = +$("#surah-select").value;
  const ayah = +$("#ayah-select").value;
  const slug = $("#tafsir-select").value;
  const edition = TAFSIR_EDITIONS.find((t) => t.slug === slug);
  const surahMeta = SURAHS[surah - 1];
  const out = $("#tafsir-output");
  out.innerHTML = `<div class="spinner"></div>`;

  const editions = `quran-uthmani,${TRANSLATIONS.en.edition},${TRANSLATIONS.ur.edition}`;
  const verseP = fetch(`${QURAN_API}/ayah/${surah}:${ayah}/editions/${editions}`).then((r) => {
    if (!r.ok) throw new Error(`AlQuran.cloud HTTP ${r.status}`);
    return r.json();
  });
  const tafsirP = fetchTafsirText(slug, surah, ayah);

  const [verseRes, tafsirRes] = await Promise.allSettled([verseP, tafsirP]);
  out.innerHTML = "";

  const verseCard = document.createElement("div");
  verseCard.className = "verse-card";
  if (verseRes.status === "fulfilled") {
    const [arabic, english, urdu] = verseRes.value.data;
    const translations = appLang === "ur"
      ? `<div class="verse-urdu">${escapeHtml(urdu.text)} <span class="muted">— ${TRANSLATIONS.ur.label}</span></div>
         <div class="verse-translation secondary-text">“${escapeHtml(english.text)}” <span class="muted">— ${TRANSLATIONS.en.label}</span></div>`
      : `<div class="verse-translation">“${escapeHtml(english.text)}” <span class="muted">— ${TRANSLATIONS.en.label}</span></div>`;
    verseCard.innerHTML = `
      <div class="verse-ref">Surah ${surahMeta[0]} (${surah}) · Verse ${ayah}</div>
      <div class="verse-arabic">${escapeHtml(arabic.text)}</div>
      ${translations}`;
  } else {
    verseCard.innerHTML = `<div class="source-error">⚠ Could not load the verse text (${escapeHtml(verseRes.reason.message)}). Please retry.</div>`;
  }
  out.appendChild(verseCard);

  const tafsirCard = document.createElement("div");
  tafsirCard.className = "tafsir-card";
  if (tafsirRes.status === "fulfilled" && tafsirRes.value) {
    tafsirCard.innerHTML = `
      <h4>${escapeHtml(edition.name)}</h4>
      <div class="scholar">${escapeHtml(edition.scholar)}</div>
      <div class="tafsir-body ${edition.lang === "ur" ? "urdu-text" : ""}" ${edition.rtl ? 'dir="rtl"' : ""} ${edition.lang === "ar" ? 'style="font-family:Amiri,serif;font-size:1.15rem;line-height:2"' : ""}>${sanitizeTafsirHtml(tafsirRes.value)}</div>`;
  } else {
    tafsirCard.innerHTML = `
      <h4>${escapeHtml(edition.name)}</h4>
      <div class="source-error">⚠ No commentary is recorded for this exact verse in this edition (commentary often covers a group of verses — try the verse just before), or the source is temporarily unreachable.</div>`;
  }
  out.appendChild(tafsirCard);
}

async function fetchTafsirText(slug, surah, ayah) {
  // Preferred: per-ayah file. Fallback: whole-surah file (some editions only ship those).
  try {
    const j = await cachedFetchJSON(`${TAFSIR_CDN}/${slug}/${surah}/${ayah}.json`);
    return j.text || "";
  } catch {
    const j = await cachedFetchJSON(`${TAFSIR_CDN}/${slug}/${surah}.json`);
    const row = (j.ayahs || []).find((a) => +a.ayah === ayah);
    return row ? row.text : "";
  }
}

// Tafsir sources ship limited HTML (headings, paragraphs). Strip anything else.
function sanitizeTafsirHtml(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const ALLOWED = new Set(["P", "BR", "B", "STRONG", "I", "EM", "H1", "H2", "H3", "H4", "UL", "OL", "LI", "BLOCKQUOTE", "SPAN", "DIV"]);
  (function walk(node) {
    for (const child of [...node.children]) {
      walk(child);
      [...child.attributes].forEach((a) => child.removeAttribute(a.name));
      if (!ALLOWED.has(child.tagName)) child.replaceWith(...child.childNodes);
    }
  })(tpl.content);
  return tpl.innerHTML;
}

/* ---------------- boot ---------------- */
initLang();
renderCollectionsPicker();
initTafsirControls();
initPro();
