/* ================= Library =================
   These are complete published books, not hadith collections, and no free
   machine-readable edition of them exists — so the app links to the copies
   hosted by archive.org and Dawat-e-Islami rather than reproducing them.
   Opening a book hands it to that site's own reader. */
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
    host: "archive.org"
  },
  {
    urdu: "حیا اور پردہ",
    title: "Haya aur Parda",
    author: "",
    about: "Modesty and the rulings of hijab, with answers to common questions.",
    aboutUr: "حیا، پردے کے احکام اور اس بارے میں عام سوالات کے جوابات۔",
    topics: ["haya", "parda", "hijab", "modesty", "حیا", "پردہ"],
    url: "https://archive.org/details/haya-aur-parda",
    host: "archive.org"
  },
  {
    urdu: "موت کا منظر",
    title: "Maut ka Manzar",
    author: "",
    about: "Death, the grave and the hereafter as described in the Qur'an and hadith.",
    aboutUr: "موت، قبر اور آخرت کے احوال قرآن و حدیث کی روشنی میں۔",
    topics: ["maut", "death", "grave", "akhirat", "موت", "قبر", "آخرت"],
    url: "https://archive.org/details/maut-ka-manzar",
    host: "archive.org"
  },
  {
    urdu: "قصص الانبیاء",
    title: "Qisas-ul-Anbiya",
    author: "Hafiz Ibn Kathir — Urdu translation",
    about: "The stories of the Prophets, from Adam to Muhammad ﷺ.",
    aboutUr: "حضرت آدم علیہ السلام سے نبی کریم ﷺ تک انبیاء کے واقعات۔",
    topics: ["qisas", "anbiya", "prophets", "stories", "قصص", "انبیاء"],
    url: "https://archive.org/details/Qassas-ul-ambiya-ImamIbnKaseerInUrdu",
    host: "archive.org"
  },
  {
    urdu: "فضائلِ اعمال",
    title: "Fazail-e-Amaal",
    author: "Shaykh Muhammad Zakariyya Kandhlawi",
    about: "The well-known collection on the merits of good deeds.",
    aboutUr: "نیک اعمال کے فضائل پر مشہور کتاب۔",
    topics: ["fazail", "amaal", "virtues", "deeds", "فضائل", "اعمال"],
    url: "https://archive.org/details/Fazail-e-Amal",
    host: "archive.org"
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
    note: "مجموعے کے اندر — inside a collection, not a direct link"
  },
  {
    urdu: "مثالی شوہر",
    title: "Misali Shohar",
    author: "",
    about: "The ideal husband — rights and conduct in marriage. Search the title in the Dawat-e-Islami library.",
    aboutUr: "شوہر کے حقوق و آداب۔ دعوتِ اسلامی کی لائبریری میں عنوان تلاش کریں۔",
    topics: ["shohar", "husband", "marriage", "nikah", "شوہر", "شادی", "نکاح"],
    url: "https://www.dawateislami.net/bookslibrary/",
    host: "dawateislami.net",
    note: "لائبریری میں تلاش کریں — library index, search the title"
  }
];
