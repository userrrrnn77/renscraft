// src/i18n.js
//
// Setup i18next. Sinkron juga <html lang> dan moment locale.
// Keys `errors.*` datang dari `code` yang server kirim (lihat
// client/src/api/api.js dan server/src/utils/apiError.js).
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import moment from "moment";
import "moment/locale/id";
import en from "./locales/en.json";
import id from "./locales/id.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      id: { translation: id },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "id"],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    returnNull: false,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "renscraft:lang",
    },
  });

// Satu tempat yang nge-apply bahasa ke DOM + moment.
const applyLang = (lng) => {
  const normalized = String(lng || "en")
    .toLowerCase()
    .startsWith("id")
    ? "id"
    : "en";
  document.documentElement.lang = normalized;
  moment.locale(normalized);
};

applyLang(i18n.resolvedLanguage);
i18n.on("languageChanged", applyLang);

export default i18n;
