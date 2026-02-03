import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './en.json';
import ko from './ko.json';

const resources = {
    en: { translation: en },
    ko: { translation: ko },
};

// Get device language and fallback to English
const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'en';
const supportedLanguage = ['en', 'ko'].includes(deviceLanguage) ? deviceLanguage : 'en';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: supportedLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        compatibilityJSON: 'v4',
    });

export default i18n;
