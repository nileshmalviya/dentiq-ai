export interface DentalGuidance { emergency: boolean; specializations: string[]; doctorIds: string[]; summary: string; }
export const emergencySource = "https://www.nhs.uk/nhs-services/dentists/how-to-find-an-nhs-dentist-in-an-emergency/";
export const emergencyMessage = "Seek emergency medical care now for severe mouth or neck swelling that affects breathing or swallowing, or heavy bleeding that will not stop. Call your local emergency number or go to the nearest emergency department. Do not wait for a routine dental booking.";
export const followUpSymptoms = ["Chewing or biting", "Hot or cold sensitivity", "Night-time pain", "Swelling or tenderness", "Braces or alignment concerns", "Swelling with breathing difficulty", "Bleeding that will not stop"];

// Deliberately limited static matching. It is general routing guidance, not clinical triage.
export function matchDentalConcern(concern: string, symptoms: string[] = []): DentalGuidance {
  const text = `${concern} ${symptoms.join(" ")}`.toLowerCase().replace(/’/g, "'");
  const emergencyText = text.replace(/(?:no|without|not experiencing)\s+(?:any\s+)?(?:difficulty (?:in )?(?:breathing|swallowing)|trouble breathing|breathing (?:difficulty|problems?)|uncontrolled bleeding|heavy bleeding)/g, "");
  const breathing = /can't breathe|cannot breathe|struggling to breathe|difficulty (?:in )?breathing|breathing difficult|trouble breathing|hard to breathe|difficulty swallowing|breathing difficulty/.test(emergencyText);
  const bleeding = /uncontrolled bleed|uncontrollable bleed|heavy bleed|bleed.{0,35}(?:won't|wont|will not|cannot|can't|doesn't|does not|isn't|is not).{0,12}stop|(?:cannot|can't) stop bleed/.test(emergencyText);
  if (breathing || bleeding) return { emergency: true, specializations: [], doctorIds: [], summary: emergencyMessage };
  if (/braces|aligner|alignment|crooked|straighten|orthodont/.test(text)) return { emergency: false, specializations: ["Orthodontics"], doctorIds: ["priya-patel"], summary: "An orthodontic consultation may be a suitable starting point for questions about tooth alignment or braces. A dentist must examine you before recommending treatment." };
  if (/toothache|tooth ache|tooth pain|root canal|sensitivity|sensitive|chewing|biting|night-time|night pain/.test(text)) return { emergency: false, specializations: ["General & Restorative Dentistry", "Endodontics"], doctorIds: ["arjun-mehta", "neha-sharma"], summary: "A general dentist can examine tooth pain or sensitivity and decide whether a specialist assessment is needed. These sample matches do not identify the cause or prescribe treatment." };
  if (/gum|swelling|tender|bleed/.test(text)) return { emergency: false, specializations: ["General Dentistry"], doctorIds: ["arjun-mehta"], summary: "Contact a dentist for an examination of gum symptoms or swelling. If swelling affects breathing or swallowing, or bleeding is heavy and will not stop, seek emergency medical care instead of a routine booking." };
  return { emergency: false, specializations: ["General Dentistry"], doctorIds: ["arjun-mehta"], summary: "A general dental consultation is a starting point for an examination and discussion of your concerns. A clinician can determine whether specialist care is needed." };
}
