/* ================= Smart search engine =================
   Free, fully client-side query intelligence:
   - Islamic-term synonym expansion (English + transliterations + Urdu script)
   - light English stemming (marriages → marriage, praying → pray)
   - typo correction against the loaded corpus vocabulary (marrige → marriage)
   - Arabic/Urdu script normalization (diacritics, ya/kaf/alef variants)
   Semantics: every concept in the query must match (AND); any synonym of a
   concept counts (OR). Exact words score higher than synonyms, synonyms
   higher than typo-corrected matches.
*/
"use strict";

// Each group is one concept: English terms, common transliterations, and Urdu-script terms.
const SYNONYM_GROUPS = [
  ["marriage", "marry", "married", "nikah", "nikaah", "wedlock", "wedding", "نکاح", "شادی"],
  ["wife", "wives", "husband", "spouse", "بیوی", "شوہر", "زوجہ"],
  ["divorce", "talaq", "talaaq", "khula", "طلاق", "خلع"],
  ["charity", "zakat", "zakah", "zakaat", "sadaqah", "sadaqa", "alms", "almsgiving", "زکوٰۃ", "زکات", "صدقہ", "خیرات"],
  ["prayer", "pray", "prays", "salah", "salat", "salaat", "namaz", "نماز", "صلوٰۃ"],
  ["fasting", "fast", "fasts", "sawm", "saum", "roza", "روزہ", "صوم"],
  ["ramadan", "ramadhan", "ramazan", "رمضان"],
  ["pilgrimage", "hajj", "haj", "umrah", "حج", "عمرہ"],
  ["knowledge", "learning", "ilm", "علم"],
  ["parents", "mother", "father", "والدین", "ماں", "باپ"],
  ["paradise", "jannah", "heaven", "جنت"],
  ["hell", "hellfire", "jahannam", "جہنم", "دوزخ"],
  ["interest", "usury", "riba", "سود", "ربا"],
  ["alcohol", "wine", "khamr", "intoxicant", "intoxicants", "liquor", "شراب"],
  ["patience", "patient", "sabr", "صبر"],
  ["repentance", "repent", "tawbah", "توبہ"],
  ["forgiveness", "forgive", "pardon", "maghfirah", "معافی", "مغفرت", "بخشش"],
  ["backbiting", "gheebah", "ghibah", "slander", "غیبت"],
  ["ablution", "wudu", "wuzu", "وضو"],
  ["adultery", "fornication", "zina", "زنا"],
  ["martyr", "martyrdom", "shahid", "shaheed", "شہید", "شہادت"],
  ["mosque", "masjid", "مسجد"],
  ["orphan", "orphans", "yateem", "یتیم"],
  ["neighbour", "neighbor", "neighbours", "neighbors", "پڑوسی", "ہمسایہ"],
  ["truth", "truthful", "truthfulness", "honesty", "سچ", "صداقت"],
  ["lie", "lying", "liar", "falsehood", "جھوٹ"],
  ["prophet", "messenger", "نبی", "رسول", "پیغمبر"],
  ["quran", "koran", "qur'an", "قرآن"],
  ["death", "dying", "موت"],
  ["grave", "qabr", "قبر"],
  ["angel", "angels", "فرشتہ", "فرشتے", "ملائکہ"],
  ["tribulation", "fitna", "fitnah", "فتنہ"],
  ["intention", "intentions", "niyyah", "نیت"],
  ["supplication", "dua", "invocation", "دعا"],
  ["mercy", "merciful", "رحمت", "رحم"],
  ["oppression", "injustice", "zulm", "ظلم"],
  ["trade", "trading", "business", "تجارت"],
  ["clothing", "clothes", "garment", "garments", "dress", "لباس"],
  ["women", "woman", "عورت", "عورتیں"],
  ["children", "child", "بچہ", "بچے", "اولاد"],
  ["modesty", "haya", "حیا"],
  ["fate", "destiny", "qadr", "predestination", "تقدیر"],
  ["funeral", "janazah", "janaza", "جنازہ"],
  ["gift", "gifts", "hadiya", "تحفہ", "ہدیہ"]
];

// Words that carry no meaning in a hadith query ("hadith about marriage" → "marriage").
const STOPWORDS = new Set([
  "the", "a", "an", "of", "in", "on", "and", "or", "for", "to", "is", "are", "was",
  "what", "who", "how", "when", "with", "does", "do", "did", "say", "says", "said",
  "about", "regarding", "concerning", "islam", "islamic",
  "hadith", "hadees", "hadis", "ahadith", "narration", "narrations",
  "حدیث", "احادیث", "بارے", "میں", "کے", "کی", "کا"
]);

/* ---------- normalization ---------- */
function smartNormalize(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[‘’ʻʼ]/g, "'")
    // Arabic/Urdu: strip harakat + tatweel, unify letter variants.
    .replace(/[ً-ْٰـؐ-ؚۖ-ۭ]/g, "")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ۃ/g, "ہ");
}
function isArabicScript(s) { return /[؀-ۿ]/.test(s); }

function stem(t) {
  if (isArabicScript(t) || t.length < 4) return t;
  let s = t.replace(/'s$/, "");
  if (s.length > 5 && s.endsWith("ies")) return s.slice(0, -3) + "y";
  if (s.length > 5 && s.endsWith("ing")) return s.slice(0, -3);
  if (s.length > 4 && s.endsWith("ed")) return s.slice(0, -2);
  if (s.length > 4 && s.endsWith("es")) return s.slice(0, -2);
  if (s.length > 3 && s.endsWith("s") && !s.endsWith("ss")) return s.slice(0, -1);
  return s;
}

/* ---------- synonym lookup table (stem → group indices) ---------- */
const SYN_INDEX = new Map();
SYNONYM_GROUPS.forEach((group, gi) => {
  for (const term of group) {
    const key = stem(smartNormalize(term));
    if (!SYN_INDEX.has(key)) SYN_INDEX.set(key, []);
    SYN_INDEX.get(key).push(gi);
  }
});

/* ---------- corpus vocabulary (for typo correction) ---------- */
const corpusVocab = new Set();
SYNONYM_GROUPS.flat().forEach((t) => corpusVocab.add(smartNormalize(t)));

function feedVocabulary(texts) {
  // Called once per loaded collection; builds the dictionary used for typo correction.
  for (const text of texts) {
    if (!text) continue;
    for (const tok of smartNormalize(text).split(/[^a-z؀-ۿ']+/)) {
      if (tok.length >= 4 && tok.length <= 18) corpusVocab.add(tok);
    }
  }
}

function levBounded(a, b, max) {
  // Bounded Levenshtein distance; returns -1 when > max.
  if (Math.abs(a.length - b.length) > max) return -1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return -1;
    prev = cur;
  }
  return prev[b.length] <= max ? prev[b.length] : -1;
}

function correctTypo(term) {
  if (term.length < 5 || isArabicScript(term)) return null;
  let best = null, bestD = 3;
  for (const w of corpusVocab) {
    if (w[0] !== term[0] || Math.abs(w.length - term.length) > 2) continue;
    const d = levBounded(term, w, 2);
    if (d > 0 && d < bestD) { bestD = d; best = w; if (d === 1) break; }
  }
  return best;
}

/* ---------- query expansion ---------- */
// Returns { groups, phrase, notes } where each group is a list of
// { t (normalized term), weight, whole (require word boundary) }.
function expandQuery(rawQuery) {
  const phrase = smartNormalize(rawQuery.trim());
  let tokens = phrase.split(/\s+/).filter(Boolean);
  const meaningful = tokens.filter((t) => !STOPWORDS.has(t));
  if (meaningful.length) tokens = meaningful;

  const groups = [];
  const synonymsUsed = new Set();
  const corrections = [];

  for (const tok of tokens) {
    const variants = new Map(); // term -> {weight, whole}
    const addVariant = (t, weight) => {
      const norm = smartNormalize(t);
      if (!variants.has(norm) || variants.get(norm).weight < weight) {
        variants.set(norm, { weight, whole: !isArabicScript(norm) && norm.length <= 4 });
      }
    };
    addVariant(tok, 3);

    let key = stem(tok);
    let groupIdxs = SYN_INDEX.get(key) || [];

    if (!groupIdxs.length && !corpusVocab.has(tok) && !corpusVocab.has(key)) {
      const fixed = correctTypo(tok);
      if (fixed) {
        corrections.push({ from: tok, to: fixed });
        addVariant(fixed, 2);
        key = stem(fixed);
        groupIdxs = SYN_INDEX.get(key) || [];
      }
    }
    for (const gi of groupIdxs) {
      for (const syn of SYNONYM_GROUPS[gi]) {
        const norm = smartNormalize(syn);
        if (norm !== tok) synonymsUsed.add(syn);
        addVariant(syn, norm === tok ? 3 : 2);
      }
    }
    groups.push([...variants.entries()].map(([t, v]) => ({ t, ...v })));
  }
  return { groups, phrase, tokens, synonymsUsed: [...synonymsUsed], corrections };
}

/* ---------- matching + scoring ---------- */
function isWordChar(c) { return /[a-z0-9؀-ۿ']/.test(c || ""); }

function countOccurrences(text, term, whole) {
  let count = 0, i = 0;
  while (count < 6 && (i = text.indexOf(term, i)) !== -1) {
    if (!whole || (!isWordChar(text[i - 1]) && !isWordChar(text[i + term.length]))) count++;
    i += term.length;
  }
  return count;
}

// texts: array of normalized strings (e.g. [english, urdu]). Returns 0 if any
// concept group fails to match; otherwise a relevance score.
function smartMatch(texts, expanded) {
  let score = 0;
  for (const group of expanded.groups) {
    let groupScore = 0;
    for (const v of group) {
      for (const text of texts) {
        if (!text) continue;
        const c = countOccurrences(text, v.t, v.whole);
        if (c) groupScore = Math.max(groupScore, Math.min(c, 4) * v.weight);
      }
    }
    if (!groupScore) return 0;
    score += groupScore;
  }
  if (expanded.tokens.length > 1) {
    for (const text of texts) if (text && text.includes(expanded.phrase)) { score += 10; break; }
  }
  return score;
}

// All variant terms, for <mark> highlighting.
function allVariantTerms(expanded) {
  const out = [];
  for (const g of expanded.groups) for (const v of g) out.push(v.t);
  return out.sort((a, b) => b.length - a.length);
}
