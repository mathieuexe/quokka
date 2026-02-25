import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
const resources = {
  fr: { translation: fr },
  en: { translation: en }
};

const languageLoaders: Record<string, () => Promise<{ default: unknown }>> = {
  es: () => import("./locales/es.json"),
  de: () => import("./locales/de.json"),
  it: () => import("./locales/it.json"),
  pt: () => import("./locales/pt.json"),
  zh: () => import("./locales/zh.json"),
  ja: () => import("./locales/ja.json"),
  hi: () => import("./locales/hi.json"),
  ru: () => import("./locales/ru.json"),
  uk: () => import("./locales/uk.json")
};

async function ensureLanguageResources(language: string): Promise<void> {
  const normalized = language.split("-")[0];
  if (i18n.hasResourceBundle(normalized, "translation")) return;
  const loader = languageLoaders[normalized];
  if (!loader) return;
  const module = await loader();
  i18n.addResourceBundle(normalized, "translation", module.default ?? module, true, true);
}

const initPromise = i18n.use(LanguageDetector).use(initReactI18next).init({
    resources,
    debug: false, // Mettre à true pour voir les logs en dev
    
    // Options de détection de langue
    detection: {
      // Ordre de détection : localStorage > navigateur > querystring
      order: ["localStorage", "navigator", "querystring"],
      // Cache la langue sélectionnée dans le localStorage
      caches: ["localStorage"],
      // Clé du localStorage
      lookupLocalStorage: "i18nextLng",
      // Clé du querystring
      lookupQuerystring: "lng"
    },

    interpolation: {
      escapeValue: false // React échappe déjà les valeurs
    },

    // Langues supportées
    supportedLngs: ["fr", "en", "es", "de", "it", "pt", "zh", "ja", "hi", "ru", "uk"],
    
    // Ne pas charger de namespace par défaut
    defaultNS: "translation",
    
    // Comportement du fallback
    fallbackLng: {
      "en-US": ["en"],
      "en-GB": ["en"],
      "es-ES": ["es"],
      "es-MX": ["es"],
      "de-DE": ["de"],
      "de-AT": ["de"],
      "it-IT": ["it"],
      "pt-BR": ["pt"],
      "pt-PT": ["pt"],
      "fr-FR": ["fr"],
      "fr-CA": ["fr"],
      "zh-CN": ["zh"],
      "zh-TW": ["zh"],
      "ja-JP": ["ja"],
      "hi-IN": ["hi"],
      "ru-RU": ["ru"],
      "uk-UA": ["uk"],
      default: ["fr"]
    }
  });

void initPromise.then(() => ensureLanguageResources(i18n.language));
i18n.on("languageChanged", (language) => {
  void ensureLanguageResources(language);
});

export default i18n;
