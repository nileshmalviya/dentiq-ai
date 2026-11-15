export type Role = "super-admin" | "doctor" | "patient";
export interface DemoUser { id: string; name: string; email: string; role: Role; doctorId?: string; patientId?: string; }
export const roleHome: Record<Role, string> = { "super-admin": "/super-admin/dashboard", doctor: "/doctor/dashboard", patient: "/patient/chat" };
export const roleLabels: Record<Role, string> = { "super-admin": "Super Admin", doctor: "Doctor", patient: "Patient" };
export function hasRole(user: DemoUser | null, role: Role) { return user?.role === role; }
