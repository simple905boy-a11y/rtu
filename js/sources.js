// ================= Data source configuration =================
// All sources are free, public, CORS-enabled, and require no API key.

// --- Sunni hadith: Hadith API (github.com/fawazahmed0/hadith-api), served from jsDelivr CDN.
// Each edition is a static JSON file with every hadith of the collection, including
// reference (book / hadith number) and scholarly gradings where recorded.
// English ("eng-…") and Urdu ("urd-…") editions share the same hadith numbering.
const HADITH_CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

const SUNNI_COLLECTIONS = [
  { id: "bukhari",  name: "Sahih al-Bukhari",   urduName: "صحیح بخاری",    edition: "eng-bukhari",  urduEdition: "urd-bukhari",  size: "~4 MB", default: true,  sunnahSlug: "bukhari" },
  { id: "muslim",   name: "Sahih Muslim",        urduName: "صحیح مسلم",     edition: "eng-muslim",   urduEdition: "urd-muslim",   size: "~4 MB", default: true,  sunnahSlug: "muslim" },
  { id: "abudawud", name: "Sunan Abu Dawud",     urduName: "سنن ابو داؤد",  edition: "eng-abudawud", urduEdition: "urd-abudawud", size: "~3 MB", default: false, sunnahSlug: "abudawud" },
  { id: "tirmidhi", name: "Jami` at-Tirmidhi",   urduName: "جامع ترمذی",    edition: "eng-tirmidhi", urduEdition: "urd-tirmidhi", size: "~3 MB", default: false, sunnahSlug: "tirmidhi" },
  { id: "nasai",    name: "Sunan an-Nasa'i",     urduName: "سنن نسائی",     edition: "eng-nasai",    urduEdition: "urd-nasai",    size: "~3 MB", default: false, sunnahSlug: "nasai" },
  { id: "ibnmajah", name: "Sunan Ibn Majah",     urduName: "سنن ابن ماجہ",  edition: "eng-ibnmajah", urduEdition: "urd-ibnmajah", size: "~3 MB", default: false, sunnahSlug: "ibnmajah" },
  { id: "malik",    name: "Muwatta Malik",       urduName: "موطأ مالک",     edition: "eng-malik",    urduEdition: "urd-malik",    size: "~2 MB", default: false, sunnahSlug: "malik" }
];

// --- Shia hadith: Thaqalayn API (thaqalayn-api.net), an open API over Thaqalayn.net —
// classical Twelver collections such as Al-Kafi, with Majlisi gradings, English
// translation and Arabic original. (No Urdu translation exists in this source yet.)
const THAQALAYN_API = "https://www.thaqalayn-api.net/api/v2";

// --- Qur'an text + translations: AlQuran.cloud (free, no key).
const QURAN_API = "https://api.alquran.cloud/v1";
const TRANSLATIONS = {
  en: { edition: "en.sahih",     label: "Saheeh International" },
  ur: { edition: "ur.jalandhry", label: "فتح محمد جالندھری" }
};

// --- Tafsir: Tafsir API (github.com/spa5k/tafsir_api), served from jsDelivr CDN.
// Note: "en-tafisr-ibn-kathir" / "ur-tafseer-ibn-e-kaseer" spellings are the actual upstream slugs.
const TAFSIR_CDN = "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir";

const TAFSIR_EDITIONS = [
  { slug: "en-tafisr-ibn-kathir",      lang: "en", name: "Tafsir Ibn Kathir (abridged)", scholar: "Hafiz Ibn Kathir (d. 774 AH) — classical exegesis", default: true },
  { slug: "en-tafsir-maarif-ul-quran", lang: "en", name: "Ma'ariful Qur'an",             scholar: "Mufti Muhammad Shafi Usmani (d. 1396 AH)" },
  { slug: "en-tazkirul-quran",         lang: "en", name: "Tazkirul Qur'an",              scholar: "Maulana Wahiduddin Khan (d. 2021)" },
  { slug: "ur-tafseer-ibn-e-kaseer",   lang: "ur", name: "تفسیر ابنِ کثیر (اردو)",       scholar: "حافظ ابنِ کثیر — اردو ترجمہ", rtl: true, urduDefault: true },
  { slug: "ur-tafsir-bayan-ul-quran",  lang: "ur", name: "بیان القرآن (اردو)",           scholar: "ڈاکٹر اسرار احمد", rtl: true },
  { slug: "ur-tafsir-fe-zalul-quran",  lang: "ur", name: "فی ظلال القرآن (اردو)",        scholar: "سید قطب — اردو ترجمہ", rtl: true },
  { slug: "ar-tafsir-ibn-kathir",      lang: "ar", name: "تفسير ابن كثير (عربي)",        scholar: "Hafiz Ibn Kathir — original Arabic", rtl: true },
  { slug: "ar-tafsir-muyassar",        lang: "ar", name: "التفسير الميسر (عربي)",        scholar: "King Fahd Complex — simplified Arabic", rtl: true }
];
const TAFSIR_GROUP_LABELS = { en: "English", ur: "اردو (Urdu)", ar: "العربية (Arabic)" };
