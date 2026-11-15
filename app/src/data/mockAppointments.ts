import { appointments } from "./appointments";
import type { Appointment } from "./appointments";
import { mockPatients } from "./mockPatients";
export interface AssignedAppointment extends Appointment { doctorId: string; patientId: string; }
export const mockAppointments: AssignedAppointment[] = [
  ...appointments.map(appointment => ({ ...appointment, doctorId: "arjun-mehta", patientId: mockPatients.find(patient => patient.name === appointment.patient)?.id || "" })),
  { id: "APT-1005", doctorId: "neha-sharma", patientId: "PT-1006", doctor: "Dr. Neha Sharma", patient: "Vikram Rao", time: "12:00 PM", purpose: "Consultation", date: "23 Apr", fee: 800, status: "Scheduled" },
  { id: "APT-1006", doctorId: "priya-patel", patientId: "PT-1005", doctor: "Dr. Priya Patel", patient: "Ananya Singh", time: "3:00 PM", purpose: "Braces", date: "23 Apr", fee: 900, status: "Scheduled" },
];
