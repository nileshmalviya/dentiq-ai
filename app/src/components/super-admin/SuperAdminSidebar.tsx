import { NavLink } from "react-router-dom";
import { Activity, Bot, Building2, CalendarDays, ClipboardList, Grid2X2, LayoutDashboard, Settings, Stethoscope, UsersRound } from "lucide-react";
import { PortalSidebar } from "../common/PortalSidebar";
import type { SidebarProps } from "../common/PortalFrame";
const items = [
  { label: "Dashboard", path: "dashboard", icon: LayoutDashboard }, { label: "Doctors Management", path: "doctors", icon: Stethoscope },
  { label: "Clinics Management", path: "clinics", icon: Building2 }, { label: "Patients Management", path: "patients", icon: UsersRound },
  { label: "All Appointments", path: "appointments", icon: CalendarDays }, { label: "AI Engine", path: "ai-engine", icon: Bot },
  { label: "Services & Categories", path: "services", icon: Grid2X2 }, { label: "Analytics", path: "analytics", icon: Activity },
  { label: "Reports", path: "reports", icon: ClipboardList }, { label: "Settings", path: "settings", icon: Settings },
];
export function SuperAdminSidebar(props: SidebarProps) {
  return <PortalSidebar {...props} home="/super-admin/dashboard" title="Super Admin Portal"><nav aria-label="Super Admin navigation">{items.map(({ label, path, icon: Icon }) => <NavLink key={path} to={`/super-admin/${path}`} onClick={props.onClose} className={({ isActive }) => `dashboard-nav-link${isActive ? " active" : ""}`}><Icon size={18} /><span>{label}</span></NavLink>)}</nav></PortalSidebar>;
}
