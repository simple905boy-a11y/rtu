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
  { id: "malik",    name: "Muwatta Malik",       urduName: "موطأ مالک",     edition: "eng-malik",    urduEdition: "urd-malik",    size: "~2 MB", default: false, sunnahSlug: "malik" },
  // Short collections — no Urdu edition is published for these three.
  { id: "nawawi",   name: "40 Hadith an-Nawawi", urduName: "اربعین نووی",   edition: "eng-nawawi",   urduEdition: null, size: "~50 KB", default: false, sunnahSlug: "nawawi40" },
  { id: "qudsi",    name: "40 Hadith Qudsi",     urduName: "چالیس حدیثِ قدسی", edition: "eng-qudsi", urduEdition: null, size: "~50 KB", default: false, sunnahSlug: "qudsi40" },
  { id: "dehlawi",  name: "40 Hadith Shah Waliullah", urduName: "اربعین شاہ ولی اللہ", edition: "eng-dehlawi", urduEdition: null, size: "~50 KB", default: false, sunnahSlug: "dehlawi40" }
];

// --- Shia hadith: Thaqalayn API (thaqalayn-api.net), an open API over Thaqalayn.net —
// classical Twelver collections such as Al-Kafi, with Majlisi gradings, English
// translation and Arabic original. (No Urdu translation exists in this source yet.)
const THAQALAYN_API = "https://www.thaqalayn-api.net/api/v2";

// --- Qur'an text + translations: AlQuran.cloud (free, no key).
const QURAN_API = "https://api.alquran.cloud/v1";

// Every Urdu and English translation alquran.cloud publishes. The reader picks one;
// the choice is remembered. `default: true` marks the fallback for each language.
const QURAN_TRANSLATIONS = {
  ur: [
    { edition: "ur.junagarhi",  label: "محمد جوناگڑھی", default: true },
    { edition: "ur.maududi",    label: "ابوالاعلیٰ مودودی (تفہیم القرآن)" },
    { edition: "ur.qadri",      label: "طاہر القادری (عرفان القرآن)" },
    { edition: "ur.kanzuliman", label: "احمد رضا خان (کنز الایمان)" },
    { edition: "ur.jalandhry",  label: "فتح محمد جالندھری" },
    { edition: "ur.ahmedali",   label: "احمد علی" },
    { edition: "ur.jawadi",     label: "علامہ جوادی (شیعہ)" },
    { edition: "ur.najafi",     label: "محمد حسین نجفی (شیعہ)" }
  ],
  en: [
    { edition: "en.sahih",      label: "Saheeh International", default: true },
    { edition: "en.maududi",    label: "Abul A'la Maududi" },
    { edition: "en.hilali",     label: "Hilali & Khan" },
    { edition: "en.yusufali",   label: "Abdullah Yusuf Ali" },
    { edition: "en.pickthall",  label: "Marmaduke Pickthall" },
    { edition: "en.asad",       label: "Muhammad Asad" },
    { edition: "en.mubarakpuri", label: "Mubarakpuri" },
    { edition: "en.itani",      label: "Clear Qur'an — Talal Itani" },
    { edition: "en.sarwar",     label: "Muhammad Sarwar (Shia)" }
  ]
};
const defaultTranslation = (lang) =>
  QURAN_TRANSLATIONS[lang].find((t) => t.default) || QURAN_TRANSLATIONS[lang][0];

// --- Tafsir: Tafsir API (github.com/spa5k/tafsir_api), served from jsDelivr CDN.
// Note: "en-tafisr-ibn-kathir" / "ur-tafseer-ibn-e-kaseer" spellings are the actual upstream slugs.
const TAFSIR_CDN = "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir";

const TAFSIR_EDITIONS = [
  { slug: "en-tafisr-ibn-kathir",      lang: "en", name: "Tafsir Ibn Kathir (abridged)", scholar: "Hafiz Ibn Kathir (d. 774 AH) — classical exegesis", default: true },
  { slug: "en-tafsir-maarif-ul-quran", lang: "en", name: "Ma'ariful Qur'an",             scholar: "Mufti Muhammad Shafi Usmani (d. 1396 AH)" },
  { slug: "en-tazkirul-quran",         lang: "en", name: "Tazkirul Qur'an",              scholar: "Maulana Wahiduddin Khan (d. 2021)" },
  { slug: "en-al-jalalayn",            lang: "en", name: "Tafsir al-Jalalayn",           scholar: "Jalal al-Din al-Mahalli & al-Suyuti" },
  { slug: "en-tafsir-ibn-abbas",       lang: "en", name: "Tanwir al-Miqbas (Ibn 'Abbas)", scholar: "Attributed to Ibn 'Abbas" },
  { slug: "en-asbab-al-nuzul-by-al-wahidi", lang: "en", name: "Asbab al-Nuzul (شانِ نزول)", scholar: "Al-Wahidi — reasons for revelation" },
  { slug: "en-tafsir-al-mukhtasar",    lang: "en", name: "Al-Mukhtasar (concise)",       scholar: "Tafsir Center for Qur'anic Studies" },

  { slug: "ur-tafseer-ibn-e-kaseer",   lang: "ur", name: "تفسیر ابنِ کثیر (اردو)",       scholar: "حافظ ابنِ کثیر — اردو ترجمہ", rtl: true, urduDefault: true },
  { slug: "ur-tafsir-bayan-ul-quran",  lang: "ur", name: "بیان القرآن (اردو)",           scholar: "ڈاکٹر اسرار احمد", rtl: true },
  { slug: "ur-tafsir-fe-zalul-quran-syed-qatab", lang: "ur", name: "فی ظلال القرآن (اردو)", scholar: "سید قطب — اردو ترجمہ", rtl: true },
  { slug: "ur-tafsir-as-saadi-urdu",   lang: "ur", name: "تفسیر السعدی (اردو)",          scholar: "علامہ عبد الرحمٰن السعدی", rtl: true },
  { slug: "ur-tazkirul-quran",         lang: "ur", name: "تذکیر القرآن (اردو)",          scholar: "مولانا وحید الدین خان", rtl: true },

  { slug: "ar-tafsir-ibn-kathir",      lang: "ar", name: "تفسير ابن كثير (عربي)",        scholar: "Hafiz Ibn Kathir — original Arabic", rtl: true },
  { slug: "ar-tafsir-al-tabari",       lang: "ar", name: "تفسير الطبري",                 scholar: "Imam Ibn Jarir al-Tabari (d. 310 AH)", rtl: true },
  { slug: "ar-tafseer-al-qurtubi",     lang: "ar", name: "تفسير القرطبي",                scholar: "Imam al-Qurtubi (d. 671 AH)", rtl: true },
  { slug: "ar-tafsir-al-baghawi",      lang: "ar", name: "تفسير البغوي",                 scholar: "Imam al-Baghawi (d. 516 AH)", rtl: true },
  { slug: "al-kashshaf-al-zamakhshari", lang: "ar", name: "الكشاف (الزمخشري)",           scholar: "Al-Zamakhshari (d. 538 AH)", rtl: true },
  { slug: "tafsir-al-razi",            lang: "ar", name: "تفسير الرازي (مفاتيح الغيب)",  scholar: "Fakhr al-Din al-Razi (d. 606 AH)", rtl: true },
  { slug: "tafsir-al-alusi",           lang: "ar", name: "تفسير الألوسي (روح المعاني)",  scholar: "Al-Alusi (d. 1270 AH)", rtl: true },
  { slug: "fath-al-qadir-al-shawkani", lang: "ar", name: "فتح القدير (الشوكاني)",        scholar: "Al-Shawkani (d. 1250 AH)", rtl: true },
  { slug: "al-durr-al-manthur",        lang: "ar", name: "الدر المنثور (السيوطي)",       scholar: "Al-Suyuti — narration-based", rtl: true },
  { slug: "tafsir-ibn-abi-hatim",      lang: "ar", name: "تفسير ابن أبي حاتم",           scholar: "Ibn Abi Hatim (d. 327 AH)", rtl: true },
  { slug: "tafsir-ibn-uthaymeen",      lang: "ar", name: "تفسير ابن عثيمين",             scholar: "Shaykh Ibn Uthaymeen (d. 1421 AH)", rtl: true },
  { slug: "ar-tafsir-muyassar",        lang: "ar", name: "التفسير الميسر (عربي)",        scholar: "King Fahd Complex — simplified Arabic", rtl: true }
];
const TAFSIR_GROUP_LABELS = { en: "English", ur: "اردو (Urdu)", ar: "العربية (Arabic)" };
