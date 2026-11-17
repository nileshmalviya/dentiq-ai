import { createContext, useContext, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { createPatientI18n, languageStorageKey, type PatientLanguage } from './index';

type LanguageContext = { language: PatientLanguage; locale: string; tr: <T>(value: T) => T; setLanguage: (language: PatientLanguage) => void };
const context = createContext<LanguageContext>({ language: 'en', locale: 'en-IN', tr: value => value, setLanguage: () => {} });
export const usePatientTranslation = () => useContext(context);
export function PatientLanguageProvider({ children }: { children: ReactNode }) {
  const [instance] = useState(createPatientI18n);
  const { t, i18n } = useTranslation(undefined, { i18n: instance });
  const language = i18n.language === 'hi' ? 'hi' : 'en';
  const tr = <T,>(value: T): T => typeof value === 'string' ? t(value.startsWith('Validation failed:') ? 'Validation failed' : value, { defaultValue: value }) as T : value;
  function setLanguage(next: PatientLanguage) {
    void i18n.changeLanguage(next);
    try { localStorage.setItem(languageStorageKey, next); } catch { /* Optional storage. */ }
  }
  return <context.Provider value={{ language, locale: language === 'hi' ? 'hi-IN' : 'en-IN', tr, setLanguage }}><div className="patient-language-scope" lang={language} onInvalidCapture={event => { const input = event.target; if (!(input instanceof HTMLInputElement)) return; input.setCustomValidity(''); if (input.validity.valueMissing) input.setCustomValidity(String(tr('Please fill in this field.'))); else if (input.validity.typeMismatch) input.setCustomValidity(String(tr('Enter a valid email address.'))); else if (input.validity.patternMismatch || input.validity.tooShort) input.setCustomValidity(String(tr('Please check this value.'))); }} onInputCapture={event => { if (event.target instanceof HTMLInputElement) event.target.setCustomValidity(''); }}>{children}</div></context.Provider>;
}
