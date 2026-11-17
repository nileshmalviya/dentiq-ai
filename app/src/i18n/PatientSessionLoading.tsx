import { PatientLanguageProvider, usePatientTranslation } from './PatientLanguage';
function LoadingMessage() {
  const { tr } = usePatientTranslation();
  return <div role="status" className="local-notice">{tr('Restoring your session…')}</div>;
}
export function PatientSessionLoading() {
  return <PatientLanguageProvider><LoadingMessage /></PatientLanguageProvider>;
}
