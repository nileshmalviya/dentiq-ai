import { PatientLanguageProvider } from '../i18n/PatientLanguage';
import { LanguageSwitcher } from '../components/patient/LanguageSwitcher';
import { useAuth } from '../auth/useAuth';
import { usePatientTranslation } from '../i18n/PatientLanguage';
import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, HeartPulse, ShieldCheck, Sparkles, Stethoscope, Users } from "lucide-react";
import { Brand } from "../components/common/Brand";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { PolicyLink } from "../modules/auth/AuthFields";
import "../styles/auth.css";

export function AuthLayout() {
 const { pathname } = useLocation(); const { user } = useAuth();
 const patient = !pathname.startsWith('/doctor/') && (!user || user.role === 'patient');
 return patient ? <PatientLanguageProvider><AuthLayoutContent patient /></PatientLanguageProvider> : <AuthLayoutContent />;
}
function AuthLayoutContent({patient=false}:{patient?:boolean}) {
  const { tr } = usePatientTranslation();

  const { pathname } = useLocation();
  const doctorRegistration=pathname.startsWith('/doctor/');
  const registering = pathname === '/register'||doctorRegistration;
  useEffect(() => {
    document.title = `${tr(pathname === "/login" ? "Portal Login" : doctorRegistration ? "Doctor Registration" : registering ? "Patient Registration" : "Forgot Password")} | DentIQ AI`;
    window.scrollTo(0, 0);
  }, [pathname, registering,doctorRegistration, tr]);
  return <div className="auth-shell">
    <header className="auth-header"><Brand /><div className="auth-header-actions"><Link to="/" className="back-home"><ArrowLeft size={15} />{tr("Back to home")}</Link>{patient && <LanguageSwitcher />}<ThemeToggle /></div></header>
    <main className={`auth-layout${registering ? " registration-layout" : ""}`}>
      <aside className="auth-story" aria-label={tr("DentIQ AI for your practice")} tabIndex={0}>
        <div className="story-content"><div className="story-badge"><span />{tr("BUILT FOR BETTER DENTAL CARE")}</div>
          <h1>{tr("Your expertise.")}<br />{tr("Our intelligence.")}<br /><span>{tr("Better smiles.")}</span></h1>
          <p>{tr("More time for your patients. Less time on the everyday. Bring your dental practice together with DentIQ AI.")}</p>
          <div className="practice-illustration" role="img" aria-label={tr("Illustration of a connected dental practice with appointments, patient records and care planning")}>
            <div className="illustration-orbit orbit-one" /><div className="illustration-orbit orbit-two" />
            <div className="tooth-tile"><svg viewBox="0 0 120 140" aria-hidden="true"><path d="M60 24C42 10 18 17 17 43c-1 19 11 29 14 48 3 18 7 31 15 30 9-1 5-35 14-35s5 34 14 35c8 1 12-12 15-30 3-19 15-29 14-48-1-26-25-33-43-19Z" fill="currentColor"/><path d="M60 24c7 5 14 7 21 5" fill="none" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round"/></svg><span className="tooth-spark"><Sparkles size={21} /></span></div>
            <div className="practice-float appointment-float"><span className="float-icon"><CalendarDays size={20} /></span><span><strong>{tr("A more organized day")}</strong><small>{tr("Appointments, all in one place")}</small></span><span className="float-check"><Check size={13} /></span></div>
            <div className="practice-float care-float"><span className="float-icon"><HeartPulse size={20} /></span><span><strong>{tr("Patient-first care")}</strong><small>{tr("Connected at every step")}</small></span></div>
            <div className="illustration-dot dot-one" /><div className="illustration-dot dot-two" />
          </div>
          <div className="story-features"><div><Users size={19} /><span>{tr("Patient management")}</span></div><div><Stethoscope size={19} /><span>{tr("Smarter practice workflows")}</span></div><div><ShieldCheck size={19} /><span>{tr("Care that stays connected")}</span></div></div>
        </div>
        <div className="story-bottom"><span className="story-bottom-icon"><Sparkles size={17} /></span><span>{tr("Thoughtfully built for the way you care.")}</span><ArrowUpRight size={17} /></div>
      </aside>
      <section className={"auth-form-panel"+(doctorRegistration?" doctor-onboarding-panel":"")} aria-label={tr("Dentiq AI account")} tabIndex={0}><Outlet /></section>
    </main>
    <footer className="auth-footer"><span>© {new Date().getFullYear()} {tr("DentIQ AI. All rights reserved.")}</span><div><PolicyLink policy="privacy">{tr("Privacy Policy")}</PolicyLink><PolicyLink policy="terms">{tr("Terms & Conditions")}</PolicyLink></div></footer>
  </div>;
}
