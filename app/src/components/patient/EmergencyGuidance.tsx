import { usePatientTranslation } from '../../i18n/PatientLanguage';
import { AlertTriangle } from "lucide-react";
import { emergencyMessage, emergencySource } from "../../data/patientGuidance";
export function EmergencyGuidance({ urgent = false }: { urgent?: boolean }) {
  const { tr } = usePatientTranslation();

  const contents = <><p>{tr(emergencyMessage)}</p><a href={emergencySource} target="_blank" rel="noopener noreferrer">{tr("Emergency dental guidance · NHS")}<span className="sr-only">{tr("(opens in a new tab)")}</span></a></>;
  return urgent ? <section className="dental-emergency" role="alert"><h2><AlertTriangle size={19} />{tr("Emergency care may be needed")}</h2>{contents}</section> : <details className="dental-safety-note"><summary><AlertTriangle size={14} />{tr("When to seek emergency care")}</summary>{contents}</details>;
}
