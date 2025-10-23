import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enumToStringEN from './locales/en/enumToString_en.json';

// const { getDefaultConfig } = require('expo/metro-config');

// const config = getDefaultConfig(__dirname);

// config.resolver.unstable_enablePackageExports = false;

// module.exports = config;
 
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enumToStringEN
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
