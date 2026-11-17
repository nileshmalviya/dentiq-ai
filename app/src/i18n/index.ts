import { createInstance } from 'i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';

export type PatientLanguage = 'en' | 'hi';
export const languageStorageKey = 'dentiq-patient-language';
export function createPatientI18n() {
  const instance = createInstance();
  let language: PatientLanguage = 'en';
  try { if (localStorage.getItem(languageStorageKey) === 'hi') language = 'hi'; } catch { /* Optional storage. */ }
  void instance.init({ lng: language, fallbackLng: 'en', resources: { en: { translation: en }, hi: { translation: hi } }, keySeparator: false, nsSeparator: false, initAsync: false, interpolation: { escapeValue: false } });
  return instance;
}
