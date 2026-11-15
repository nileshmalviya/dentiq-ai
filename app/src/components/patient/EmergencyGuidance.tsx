import { AlertTriangle } from "lucide-react";
import { emergencyMessage, emergencySource } from "../../data/patientGuidance";
export function EmergencyGuidance({ urgent = false }: { urgent?: boolean }) {
  const contents = <><p>{emergencyMessage}</p><a href={emergencySource} target="_blank" rel="noopener noreferrer">Emergency dental guidance · NHS<span className="sr-only"> (opens in a new tab)</span></a></>;
  return urgent ? <section className="dental-emergency" role="alert"><h2><AlertTriangle size={19} />Emergency care may be needed</h2>{contents}</section> : <details className="dental-safety-note"><summary><AlertTriangle size={14} />When to seek emergency care</summary>{contents}</details>;
}
