import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";
import hi from "./locales/hi.json";
import ru from "./locales/ru.json";
import uk from "./locales/uk.json";

// Configuration des ressources de traduction
const resources = {
  fr: { translation: fr },
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  it: { translation: it },
  pt: { translation: pt },
  zh: { translation: zh },
  ja: { translation: ja },
  hi: { translation: hi },
  ru: { translation: ru },
  uk: { translation: uk }
};

i18n
  // Détection automatique de la langue du navigateur
  .use(LanguageDetector)
  // Intégration avec React
  .use(initReactI18next)
  // Initialisation
  .init({
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

export default i18n;
