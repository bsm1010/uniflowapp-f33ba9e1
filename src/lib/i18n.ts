import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import ar from "@/locales/ar.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "ar", label: "العربية", short: "AR" },
] as const;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    lng: "en",
    fallbackLng: "en",
    supportedLngs: ["en", "fr", "ar"],
    interpolation: { escapeValue: false },
  });
}

export function applyDirection(lng: string) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("dir", "ltr");
  document.documentElement.setAttribute("lang", lng);
  document.documentElement.classList.toggle("font-arabic", lng === "ar");
}

i18n.on("languageChanged", applyDirection);

export function getSavedLanguage() {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem("lang");
    return saved === "fr" || saved === "ar" || saved === "en" ? saved : "en";
  } catch {
    return "en";
  }
}

export default i18n;
