import { NavLink } from "react-router-dom";
import { BarChart3, Bot, CalendarDays, CreditCard, FileHeart, LayoutDashboard, Package, Settings, Stethoscope, UsersRound } from "lucide-react";
import { PortalSidebar } from "../common/PortalSidebar";
import type { SidebarProps } from "../common/PortalFrame";
const items = [
  { label: "Dashboard", path: "dashboard", icon: LayoutDashboard }, { label: "My Appointments", path: "appointments", icon: CalendarDays },
  { label: "My Patients", path: "patients", icon: UsersRound }, { label: "Clinical Notes", path: "clinical-notes", icon: FileHeart },
  { label: "AI Consultations", path: "consultations", icon: Bot }, { label: "Treatment Plans", path: "treatment-plans", icon: Stethoscope },
  { label: "Billing", path: "billing", icon: CreditCard }, { label: "Inventory Management", path: "inventory", icon: Package }, { label: "Reports", path: "reports", icon: BarChart3 }, { label: "Settings", path: "settings", icon: Settings },
];
export function DoctorSidebar(props: SidebarProps) {
  return <PortalSidebar {...props} home="/doctor/dashboard" title="Doctor Portal"><nav aria-label="Doctor navigation">{items.map(({ label, path, icon: Icon }) => <NavLink key={path} to={`/doctor/${path}`} onClick={props.onClose} className={({ isActive }) => `dashboard-nav-link${isActive ? " active" : ""}`}><Icon size={18} /><span>{label}</span></NavLink>)}</nav></PortalSidebar>;
}
