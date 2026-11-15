import { clinicalNotes, consultations, treatmentPlans } from "./dashboard";
import { invoices } from "./appointments";
import { mockPatients } from "./mockPatients";
const assignment = (patient: string) => ({ doctorId: "arjun-mehta", patientId: mockPatients.find(row => row.name === patient)?.id || "" });
export const mockClinicalNotes = [
  ...clinicalNotes.map(note => ({ ...note, ...assignment(note.patient) })),
  { id: "NOTE-04", patient: "Vikram Rao", patientId: "PT-1006", doctorId: "neha-sharma", date: "22 Apr", title: "Endodontic review", content: "Fictional clinical note assigned to Dr. Neha Sharma." },
];
export const mockConsultations = [
  ...consultations.map(row => ({ ...row, ...assignment(row.patient) })),
  { id: "AI-004", patient: "Vikram Rao", patientId: "PT-1006", doctorId: "neha-sharma", concern: "Follow-up", symptoms: "Sample concern", time: "2 hours ago", status: "Pending" },
];
export const mockTreatmentPlans = [
  ...treatmentPlans.map(plan => ({ ...plan, ...assignment(plan.patient) })),
  { id: "TP-004", patient: "Vikram Rao", patientId: "PT-1006", doctorId: "neha-sharma", title: "Endodontic review plan", completed: 1, total: 2, steps: ["Consultation", "Review"], status: "In Progress" },
];
export const mockInvoices = [
  ...invoices.map(invoice => ({ ...invoice, ...assignment(invoice.patient) })),
  { id: "INV-1005", patient: "Vikram Rao", patientId: "PT-1006", doctorId: "neha-sharma", treatment: "Consultation", date: "23 Apr", amount: 800, status: "Pending" },
];
export const practiceTrend = [
  { month: "Jul", appointments: 8, revenue: 6400 }, { month: "Aug", appointments: 9, revenue: 7200 },
  { month: "Sep", appointments: 9, revenue: 7200 }, { month: "Oct", appointments: 10, revenue: 8000 },
  { month: "Nov", appointments: 11, revenue: 8800 }, { month: "Dec", appointments: 12, revenue: 9300 },
];
