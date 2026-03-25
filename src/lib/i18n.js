import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '../locales/en.json'
import fr from '../locales/fr.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr'],
    detection: {
      // Detect from navigator.language (browser/OS locale setting)
      order: ['navigator'],
      // Do NOT cache — always re-detect from browser on each load
      caches: [],
    },
    interpolation: { escapeValue: false },
  })

export default i18n
