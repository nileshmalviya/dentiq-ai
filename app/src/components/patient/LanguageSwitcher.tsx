import { usePatientTranslation } from '../../i18n/PatientLanguage';
export function LanguageSwitcher() {
  const { language, setLanguage } = usePatientTranslation();
  return <div className="patient-language-switcher" role="group" aria-label="English / हिन्दी">{(['en', 'hi'] as const).map((item, index) => <span key={item}>{index > 0 && <span aria-hidden="true"> | </span>}<button type="button" lang={item} aria-pressed={language === item} onClick={() => setLanguage(item)}>{item === 'en' ? 'English' : 'हिन्दी'}</button></span>)}</div>;
}
