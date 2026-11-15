export type Role = "super-admin" | "doctor" | "patient";
export interface DemoUser { id: string; name: string; email: string; role: Role; doctorId?: string; patientId?: string; registrationManaged?:boolean;emailVerified?:boolean;approvalStatus?:string;doctorAccess?:boolean; }
export const roleHome: Record<Role, string> = { "super-admin": "/super-admin/dashboard", doctor: "/doctor/dashboard", patient: "/patient/chat" };
export const roleLabels: Record<Role, string> = { "super-admin": "Super Admin", doctor: "Doctor", patient: "Patient" };
export function hasRole(user: DemoUser | null, role: Role) { return user?.role === role; }

export function accountHome(user:DemoUser){if(user.role==='doctor'&&user.registrationManaged&&user.doctorAccess!==true){if(!user.emailVerified)return '/doctor/verify-email';return user.approvalStatus==='DRAFT'?'/doctor/verification-request':'/doctor/registration-status';}return roleHome[user.role];}
