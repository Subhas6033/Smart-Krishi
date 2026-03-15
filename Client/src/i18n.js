import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../i18n/en.json";
import hi from "../i18n/hi.json";
import ta from "../i18n/ta.json";
import te from "../i18n/te.json";
import kn from "../i18n/kn.json";
import ml from "../i18n/ml.json";
import bn from "../i18n/bn.json";
import gu from "../i18n/gu.json";
import pa from "../i18n/pa.json";
import mr from "../i18n/mr.json";
import ur from "../i18n/ur.json";
import or_ from "../i18n/or.json";
import as_ from "../i18n/as.json";
import sa from "../i18n/sa.json";
import mai from "../i18n/mai.json";
import kok from "../i18n/kok.json";
import doi from "../i18n/doi.json";
import sd from "../i18n/sd.json";
import mni from "../i18n/mni.json";
import sat from "../i18n/sat.json";
import ks from "../i18n/ks.json";
import ne from "../i18n/ne.json";
import bo from "../i18n/bo.json";

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
    as: { translation: as_ },
    sa: { translation: sa },
    mai: { translation: mai },
    kok: { translation: kok },
    doi: { translation: doi },
    sd: { translation: sd },
    mni: { translation: mni },
    sat: { translation: sat },
    ks: { translation: ks },
    ne: { translation: ne },
    bo: { translation: bo },
  },
  lng: localStorage.getItem("preferred_lang") || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
