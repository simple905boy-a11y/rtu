/* ================= Library =================
   These are complete published books, not hadith collections, and no free
   machine-readable edition of them exists.

   The app does not copy them. Most are still in copyright, and republishing
   them from this repository would put that liability on its owner. Instead
   each archive.org title is shown through archive.org's own embed reader
   (`/embed/<id>`, a facility they provide for exactly this), so the book opens
   inside the app while remaining hosted and served by archive.org.

   Consequence to remember: these are page scans, so the app's hadith search
   cannot search their contents. */
"use strict";

const LIBRARY = [
  {
    urdu: "اسلامی بہنوں کی نماز",
    title: "Islami Behnon ki Namaz",
    author: "",
    about: "Women's prayer explained step by step — purity, timings, method and common mistakes.",
    aboutUr: "خواتین کے لیے نماز کا مکمل طریقہ — طہارت، اوقات اور عام غلطیاں۔",
    topics: ["namaz", "prayer", "women", "نماز", "عورت"],
    url: "https://archive.org/details/islami-behno-ki-namaz_202307",
    host: "archive.org",
    archiveId: "islami-behno-ki-namaz_202307"
  },
  {
    urdu: "حیا اور پردہ",
    title: "Haya aur Parda",
    author: "",
    about: "Modesty and the rulings of hijab, with answers to common questions.",
    aboutUr: "حیا، پردے کے احکام اور اس بارے میں عام سوالات کے جوابات۔",
    topics: ["haya", "parda", "hijab", "modesty", "حیا", "پردہ"],
    url: "https://archive.org/details/haya-aur-parda",
    host: "archive.org",
    archiveId: "haya-aur-parda"
  },
  {
    urdu: "موت کا منظر",
    title: "Maut ka Manzar",
    author: "",
    about: "Death, the grave and the hereafter as described in the Qur'an and hadith.",
    aboutUr: "موت، قبر اور آخرت کے احوال قرآن و حدیث کی روشنی میں۔",
    topics: ["maut", "death", "grave", "akhirat", "موت", "قبر", "آخرت"],
    url: "https://archive.org/details/maut-ka-manzar",
    host: "archive.org",
    archiveId: "maut-ka-manzar"
  },
  {
    urdu: "قصص الانبیاء",
    title: "Qisas-ul-Anbiya",
    author: "Hafiz Ibn Kathir — Urdu translation",
    about: "The stories of the Prophets, from Adam to Muhammad ﷺ.",
    aboutUr: "حضرت آدم علیہ السلام سے نبی کریم ﷺ تک انبیاء کے واقعات۔",
    topics: ["qisas", "anbiya", "prophets", "stories", "قصص", "انبیاء"],
    url: "https://archive.org/details/Qassas-ul-ambiya-ImamIbnKaseerInUrdu",
    host: "archive.org",
    archiveId: "Qassas-ul-ambiya-ImamIbnKaseerInUrdu"
  },
  {
    urdu: "فضائلِ اعمال",
    title: "Fazail-e-Amaal",
    author: "Shaykh Muhammad Zakariyya Kandhlawi",
    about: "The well-known collection on the merits of good deeds.",
    aboutUr: "نیک اعمال کے فضائل پر مشہور کتاب۔",
    topics: ["fazail", "amaal", "virtues", "deeds", "فضائل", "اعمال"],
    url: "https://archive.org/details/Fazail-e-Amal",
    host: "archive.org",
    archiveId: "Fazail-e-Amal"
  },
  {
    urdu: "فضائلِ صدقات",
    title: "Fazail-e-Sadaqat",
    author: "Shaykh Muhammad Zakariyya Kandhlawi",
    about: "On the merits of charity. Part of the same volume set as Fazail-e-Amaal — open the link and go to volume 2.",
    aboutUr: "صدقہ و خیرات کے فضائل۔ یہ فضائلِ اعمال ہی کی جلد دوم میں شامل ہے۔",
    topics: ["fazail", "sadaqat", "charity", "zakat", "فضائل", "صدقات", "خیرات"],
    url: "https://archive.org/details/Fazail-e-Amal",
    host: "archive.org",
    archiveId: "Fazail-e-Amal",
    note: "جلد ۲ میں — volume 2 of the linked set"
  },
  {
    urdu: "جواہر تاریخِ اسلامی",
    title: "Jawahir-e-Tareekh-e-Islami",
    author: "",
    about: "Islamic history. The link opens a collection of Urdu history books — find this title within it.",
    aboutUr: "اسلامی تاریخ۔ یہ لنک اردو تاریخی کتب کے مجموعے پر کھلتا ہے۔",
    topics: ["tareekh", "history", "islami", "تاریخ", "اسلامی"],
    url: "https://archive.org/details/IslamicBooksHistoryBooksInUrdu",
    host: "archive.org",
    archiveId: "IslamicBooksHistoryBooksInUrdu",
    note: "مجموعے کے اندر — inside a collection, not a direct link"
  },
  {
    urdu: "مثالی بیوی، مثالی شوہر",
    title: "Misali Biwi, Misali Shohar",
    author: "Dawat-e-Islami",
    about: "The ideal wife and the ideal husband — rights and conduct in marriage.",
    aboutUr: "بیوی اور شوہر کے حقوق و آداب۔",
    topics: ["shohar", "biwi", "husband", "wife", "marriage", "nikah", "شوہر", "بیوی", "شادی", "نکاح"],
    pdf: "books/misali-biwi-misali-shohar.pdf",
    url: "books/misali-biwi-misali-shohar.pdf",
    host: "اسی ایپ میں — in this app",
    note: "اسکین شدہ صفحات — page scans, so the text inside cannot be searched"
  },
  {
    urdu: "زبان کی حفاظت کی اہمیت",
    title: "The Importance of Guarding the Tongue",
    author: "Dawat-e-Islami",
    about: "On the harms of unrestrained speech — backbiting, futile talk, and the accountability of every word.",
    aboutUr: "بے قابو زبان کے نقصانات — غیبت، فضول گفتگو اور ہر لفظ کی جوابدہی۔",
    topics: ["tongue", "zaban", "speech", "backbiting", "gheebat", "زبان", "غیبت", "گفتگو"],
    pdf: "books/guarding-the-tongue.pdf",
    url: "books/guarding-the-tongue.pdf",
    host: "اسی ایپ میں — in this app",
    // This one carries a real text layer, so its pages are searchable.
    textIndex: "books/guarding-the-tongue.pages.json"
  }
];
