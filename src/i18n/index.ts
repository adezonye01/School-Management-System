import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import arTranslations from './locales/ar.json';
import enTranslations from './locales/en.json';

const resources = {
  ar: { translation: arTranslations },
  en: { translation: enTranslations },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar', // Default language is Arabic
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Function to change language and direction
export const changeLanguage = (lang: 'ar' | 'en') => {
  i18n.changeLanguage(lang);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
  localStorage.setItem('language', lang);
  localStorage.setItem('direction', dir);
};

// Initialize direction on load
export const initializeDirection = () => {
  const savedLang = localStorage.getItem('language') || 'ar';
  const dir = savedLang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = savedLang;
};

export default i18n;
