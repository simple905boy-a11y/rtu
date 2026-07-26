/* ================= Al-Miftah — application logic ================= */
"use strict";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

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
  editions: new Map(),   // editionId -> { meta, hadiths } (Sunni, loaded lazily)
  lastQuery: ""
};

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

/* ---------- text search helpers ---------- */
function normalize(s) { return (s || "").toLowerCase().replace(/[‘’']/g, "'"); }

function scoreText(text, terms, phrase) {
  const t = normalize(text);
  let score = 0;
  for (const term of terms) {
    const wordRe = new RegExp(`\\b${escapeRe(term)}`, "g");
    const hits = (t.match(wordRe) || []).length;
    if (!hits && !t.includes(term)) return 0; // AND semantics — every term must appear
    score += hits * 2 + (t.includes(term) ? 1 : 0);
  }
  if (terms.length > 1 && t.includes(phrase)) score += 10;
  return score;
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function highlight(text, terms) {
  let out = escapeHtml(text);
  for (const term of terms) {
    out = out.replace(new RegExp(`(${escapeRe(term)})`, "gi"), "<mark>$1</mark>");
  }
  return out;
}
function escapeHtml(s) {
  return (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/* ---------- Sunni: load + search ---------- */
async function ensureEdition(col) {
  if (hadithState.editions.has(col.id)) return hadithState.editions.get(col.id);
  const url = `${HADITH_CDN}/${col.edition}.min.json`;
  setStatus(`Downloading <strong>${col.name}</strong> (one-time, ${col.size} — cached for future searches)…`, 0);
  const data = await cachedFetchJSON(url, (p) => setStatus(`Downloading <strong>${col.name}</strong> (one-time, ${col.size})…`, p));
  const parsed = { meta: data.metadata || {}, hadiths: data.hadiths || [] };
  hadithState.editions.set(col.id, parsed);
  return parsed;
}

function searchSunni(col, edition, terms, phrase) {
  const out = [];
  for (const h of edition.hadiths) {
    const s = scoreText(h.text, terms, phrase);
    if (s > 0) {
      out.push({
        score: s,
        collection: col.name,
        colId: col.id,
        number: h.hadithnumber,
        book: h.reference ? h.reference.book : null,
        inBookRef: h.reference ? h.reference.hadith : null,
        text: h.text,
        grades: (h.grades || []).map((g) => ({ by: g.name, grade: g.grade })),
        link: `https://sunnah.com/${col.sunnahSlug}:${h.hadithnumber}`
      });
    }
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

/* ---------- Shia: Thaqalayn API ---------- */
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
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const phrase = normalize(query);
  const resultsEl = $("#results");
  const summaryEl = $("#results-summary");
  resultsEl.innerHTML = `<div class="spinner"></div>`;
  summaryEl.hidden = true;

  const wantSunni = hadithState.sect !== "shia";
  const wantShia = hadithState.sect !== "sunni" && shiaSelected();

  const sunniGroups = [];
  const errors = [];

  if (wantSunni) {
    for (const col of selectedSunni()) {
      try {
        const edition = await ensureEdition(col);
        if (token !== searchToken) return; // superseded by a newer search
        const hits = searchSunni(col, edition, terms, phrase);
        if (hits.length) sunniGroups.push({ col, hits });
      } catch (e) {
        errors.push(`Could not load ${col.name}: ${e.message}`);
      }
    }
  }

  let shiaHits = [];
  if (wantShia) {
    setStatus("Searching Shia collections via Thaqalayn…");
    try {
      shiaHits = await searchShia(query);
      // Keep AND semantics consistent with the Sunni side.
      shiaHits = shiaHits
        .map((h) => ({ ...h, score: scoreText(h.text, terms, phrase) }))
        .filter((h) => h.score > 0 || terms.length === 0)
        .sort((a, b) => b.score - a.score);
    } catch (e) {
      errors.push(`Shia source (thaqalayn-api.net) is unreachable right now — please retry shortly. (${e.message})`);
    }
  }
  if (token !== searchToken) return;
  setStatus(null);

  renderResults({ query, terms, sunniGroups, shiaHits, errors });
}

const PAGE = 5;
function renderResults({ query, terms, sunniGroups, shiaHits, errors }) {
  const resultsEl = $("#results");
  const summaryEl = $("#results-summary");
  const totalSunni = sunniGroups.reduce((n, g) => n + g.hits.length, 0);
  const total = totalSunni + shiaHits.length;

  summaryEl.hidden = false;
  summaryEl.textContent = `${total} narration${total === 1 ? "" : "s"} found for “${query}” — ${totalSunni} Sunni · ${shiaHits.length} Shia`;

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
    for (const g of sunniGroups) appendGroup(sect, `${g.col.name} — ${g.hits.length} match${g.hits.length === 1 ? "" : "es"}`, g.hits, terms);
    resultsEl.appendChild(sect);
  }

  if (hadithState.sect !== "sunni") {
    const sect = sectionEl("Shia collections", "shia");
    if (!shiaSelected()) sect.appendChild(emptyEl("Shia collections are unchecked in the Collections menu."));
    else if (shiaHits.length === 0 && !errors.some((e) => e.includes("thaqalayn"))) sect.appendChild(emptyEl("No matches in the Shia corpus."));
    if (shiaHits.length) appendGroup(sect, `Thaqalayn corpus — ${shiaHits.length} match${shiaHits.length === 1 ? "" : "es"}`, shiaHits, terms);
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

  const citation = `${h.collection}${h.number !== "" ? " " + h.number : ""}${h.book != null ? ` (Book ${h.book}${h.inBookRef != null ? ", Hadith " + h.inBookRef : ""})` : ""}`;

  card.innerHTML = `
    <div class="hadith-ref">${refParts.join("")}</div>
    <div class="hadith-text">${highlight(truncate(h.text, 900), terms)}</div>
    ${h.arabic ? `<div class="hadith-arabic">${escapeHtml(truncate(h.arabic, 700))}</div>` : ""}
    <div class="hadith-actions">
      <a href="${escapeHtml(h.link)}" target="_blank" rel="noopener">View at source ↗</a>
      <button type="button" class="copy-cite">Copy citation</button>
    </div>`;

  card.querySelector(".copy-cite").addEventListener("click", (e) => {
    navigator.clipboard.writeText(`"${h.text}" — ${citation}`).then(() => {
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
function initTafsirControls() {
  const surahSel = $("#surah-select");
  surahSel.innerHTML = SURAHS.map((s, i) => `<option value="${i + 1}">${i + 1}. ${s[0]} — ${s[1]}</option>`).join("");
  surahSel.addEventListener("change", fillAyahSelect);

  const tafsirSel = $("#tafsir-select");
  tafsirSel.innerHTML = TAFSIR_EDITIONS.map((t) => `<option value="${t.slug}" ${t.default ? "selected" : ""}>${t.name}</option>`).join("");

  fillAyahSelect();
  $("#load-tafsir").addEventListener("click", loadTafsir);
  $("#prev-ayah").addEventListener("click", () => stepAyah(-1));
  $("#next-ayah").addEventListener("click", () => stepAyah(1));
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
  const surah = +$("#surah-select").value;
  const ayah = +$("#ayah-select").value;
  const slug = $("#tafsir-select").value;
  const edition = TAFSIR_EDITIONS.find((t) => t.slug === slug);
  const surahMeta = SURAHS[surah - 1];
  const out = $("#tafsir-output");
  out.innerHTML = `<div class="spinner"></div>`;

  const verseP = fetch(`${QURAN_API}/ayah/${surah}:${ayah}/editions/quran-uthmani,${TRANSLATION_EDITION}`).then((r) => {
    if (!r.ok) throw new Error(`AlQuran.cloud HTTP ${r.status}`);
    return r.json();
  });
  const tafsirP = fetchTafsirText(slug, surah, ayah);

  const [verseRes, tafsirRes] = await Promise.allSettled([verseP, tafsirP]);
  out.innerHTML = "";

  const verseCard = document.createElement("div");
  verseCard.className = "verse-card";
  if (verseRes.status === "fulfilled") {
    const [arabic, english] = verseRes.value.data;
    verseCard.innerHTML = `
      <div class="verse-ref">Surah ${surahMeta[0]} (${surah}) · Verse ${ayah}</div>
      <div class="verse-arabic">${escapeHtml(arabic.text)}</div>
      <div class="verse-translation">“${escapeHtml(english.text)}” <span class="muted">— Saheeh International</span></div>`;
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
      <div class="tafsir-body" ${edition.rtl ? 'dir="rtl" style="font-family:Amiri,serif;font-size:1.15rem;line-height:2"' : ""}>${sanitizeTafsirHtml(tafsirRes.value)}</div>`;
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
renderCollectionsPicker();
initTafsirControls();
