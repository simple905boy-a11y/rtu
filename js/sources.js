// ================= Data source configuration =================
// All sources are free, public, CORS-enabled, and require no API key.

// --- Sunni hadith: Hadith API (github.com/fawazahmed0/hadith-api), served from jsDelivr CDN.
// Each edition is a static JSON file with every hadith of the collection in English,
// including reference (book / hadith number) and scholarly gradings where recorded.
const HADITH_CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

const SUNNI_COLLECTIONS = [
  { id: "bukhari",  name: "Sahih al-Bukhari",   edition: "eng-bukhari",  size: "~4 MB", default: true,  sunnahSlug: "bukhari" },
  { id: "muslim",   name: "Sahih Muslim",        edition: "eng-muslim",   size: "~4 MB", default: true,  sunnahSlug: "muslim" },
  { id: "abudawud", name: "Sunan Abu Dawud",     edition: "eng-abudawud", size: "~3 MB", default: false, sunnahSlug: "abudawud" },
  { id: "tirmidhi", name: "Jami` at-Tirmidhi",   edition: "eng-tirmidhi", size: "~3 MB", default: false, sunnahSlug: "tirmidhi" },
  { id: "nasai",    name: "Sunan an-Nasa'i",     edition: "eng-nasai",    size: "~3 MB", default: false, sunnahSlug: "nasai" },
  { id: "ibnmajah", name: "Sunan Ibn Majah",     edition: "eng-ibnmajah", size: "~3 MB", default: false, sunnahSlug: "ibnmajah" },
  { id: "malik",    name: "Muwatta Malik",       edition: "eng-malik",    size: "~2 MB", default: false, sunnahSlug: "malik" }
];

// --- Shia hadith: Thaqalayn API (thaqalayn-api.net), an open API over Thaqalayn.net —
// classical Twelver collections such as Al-Kafi, with Majlisi gradings and English translation.
const THAQALAYN_API = "https://www.thaqalayn-api.net/api/v2";

// --- Qur'an text + translation: AlQuran.cloud (free, no key).
const QURAN_API = "https://api.alquran.cloud/v1";
const TRANSLATION_EDITION = "en.sahih"; // Saheeh International

// --- Tafsir: Tafsir API (github.com/spa5k/tafsir_api), served from jsDelivr CDN.
// Note: "en-tafisr-ibn-kathir" spelling is the actual upstream slug.
const TAFSIR_CDN = "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir";

const TAFSIR_EDITIONS = [
  { slug: "en-tafisr-ibn-kathir",     name: "Tafsir Ibn Kathir (abridged)", scholar: "Hafiz Ibn Kathir (d. 774 AH) — classical Sunni exegesis", default: true },
  { slug: "en-tafsir-maarif-ul-quran", name: "Ma'ariful Qur'an",            scholar: "Mufti Muhammad Shafi Usmani (d. 1396 AH)" },
  { slug: "en-tazkirul-quran",         name: "Tazkirul Qur'an",             scholar: "Maulana Wahiduddin Khan (d. 2021)" },
  { slug: "ar-tafsir-ibn-kathir",      name: "تفسير ابن كثير (Arabic)",     scholar: "Hafiz Ibn Kathir — original Arabic", rtl: true },
  { slug: "ar-tafsir-muyassar",        name: "التفسير الميسر (Arabic)",     scholar: "King Fahd Complex — simplified Arabic", rtl: true }
];
