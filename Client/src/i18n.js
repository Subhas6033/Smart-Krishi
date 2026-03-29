import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../../i18n/en.json";
import hi from "../../i18n/hi.json";
import ta from "../../i18n/ta.json";
import te from "../../i18n/te.json";
import kn from "../../i18n/kn.json";
import ml from "../../i18n/ml.json";
import bn from "../../i18n/bn.json";
import gu from "../../i18n/gu.json";
import pa from "../../i18n/pa.json";
import mr from "../../i18n/mr.json";
import ur from "../../i18n/ur.json";
import or_ from "../../i18n/or.json";

// Strip region suffix: "hi-IN" → "hi", "en-US" → "en"
const savedLang = (
  localStorage.getItem("preferred_lang") ||
  navigator.language ||
  "en"
).split("-")[0];

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ta: { translation: ta },
    te: { translation: te },
    kn: { translation: kn },
    ml: { translation: ml },
    bn: { translation: bn },
    gu: { translation: gu },
    pa: { translation: pa },
    mr: { translation: mr },
    ur: { translation: ur },
    or: { translation: or_ },
  },
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  // Prevent i18next from appending region codes internally
  load: "languageOnly",
});

export default i18n;
