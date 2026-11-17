import { PatientLanguageProvider } from '../i18n/PatientLanguage';
import { ApiNotice } from '../components/common/ApiNotice';
import { usePatientTranslation } from '../i18n/PatientLanguage';
﻿import { useEffect } from "react";
import { Heart, House, CalendarDays, UserRound, MessageCircle } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { PatientFlowProvider } from "../components/patient/PatientFlowProvider";
import { useAuth } from "../auth/useAuth";
const tabs = [{ to: "/patient/chat", label: "Chat", icon: MessageCircle }, { to: "/patient/home", label: "Home", icon: House }, { to: "/patient/booking", label: "Booking", icon: CalendarDays }, { to: "/patient/records", label: "Records", icon: Heart }, { to: "/patient/profile", label: "Profile", icon: UserRound }];
export function PatientLayout() { return <PatientLanguageProvider><ApiNotice /><PatientLayoutContent /></PatientLanguageProvider>; }
function PatientLayoutContent() {
  const { tr } = usePatientTranslation();

  const { pathname } = useLocation(); const { user } = useAuth();
  const chat = pathname === "/" || pathname === "/patient/chat";
  const bottomNav = ["/patient/home", "/patient/records", "/patient/profile"].includes(pathname);
  useEffect(() => { document.title = `Dentiq AI | ${tr(chat ? "Dental assistant" : pathname.split("/").at(-1)?.replace(/-/g, " ") || "Home")}`; }, [pathname, chat, tr]);
  return <PatientFlowProvider key={user?.id || "guest"}><div className="platform patient-stage"><div className="patient-desktop-bar"><span>{tr("Dentiq AI · Patient Portal")}</span><div><Link to="/patient/chat">{tr("Dental assistant")}</Link>{user?.role === "patient" ? <Link to="/patient/profile">{tr("My profile")}</Link> : <Link to="/login">{tr("Sign in")}</Link>}</div></div><div className={`patient-device${chat ? " chat-device" : ""}`}><div className={`patient-screen${bottomNav ? " has-bottom-nav" : ""}`} key={pathname}><Outlet /></div>{bottomNav && <nav className="patient-bottom-nav" aria-label={tr("Patient navigation")}>{tabs.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? "active" : ""}><Icon size={21} /><span>{tr(label)}</span></NavLink>)}</nav>}</div><p className="patient-demo-label">{tr("Patient demo · no real bookings or AI diagnosis")}</p></div></PatientFlowProvider>;
}
