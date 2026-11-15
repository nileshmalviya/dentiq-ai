import type { DemoUser } from "../auth/permissions";
export interface MockUser extends DemoUser { password: string; }
export const mockUsers: MockUser[] = [
  { id: "demo-super-admin", name: "Super Admin", email: "admin@dentiq.com", password: "Admin@123", role: "super-admin" },
  { id: "demo-doctor", name: "Dr. Arjun Mehta", email: "doctor@dentiq.com", password: "Doctor@123", role: "doctor", doctorId: "arjun-mehta" },
  { id: "demo-patient", name: "Rohan Kapoor", email: "patient@dentiq.com", password: "Patient@123", role: "patient", patientId: "PT-1001" },
];
export function publicUser({ password, ...user }: MockUser): DemoUser { void password; return user; }
