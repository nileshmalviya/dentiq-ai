import { dentalRecords, patients } from "./patients";
import type { Patient } from "./patients";
export interface AssignedPatient extends Patient { doctorIds: string[]; }
export const mockPatients: AssignedPatient[] = patients.map(patient => ({ ...patient, doctorIds: patient.id === "PT-1006" ? ["neha-sharma"] : patient.id === "PT-1005" ? ["arjun-mehta", "priya-patel"] : ["arjun-mehta"] }));
export const mockDentalRecords = dentalRecords.map(record => ({ ...record, patientId: "PT-1001" }));
