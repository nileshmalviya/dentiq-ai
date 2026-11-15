import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, HeartPulse, ShieldCheck, Sparkles, Stethoscope, Users } from "lucide-react";
import { Brand } from "../components/common/Brand";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { PolicyLink } from "../modules/auth/AuthFields";
import "../styles/auth.css";

export function AuthLayout() {
  const { pathname } = useLocation();
  const doctorRegistration=pathname.startsWith('/doctor/');
  const registering = pathname === '/register'||doctorRegistration;
  useEffect(() => {
    document.title = `${pathname === "/login" ? "Portal Login" : doctorRegistration ? "Doctor Registration" : registering ? "Patient Registration" : "Forgot Password"} | DentIQ AI`;
    window.scrollTo(0, 0);
  }, [pathname, registering,doctorRegistration]);
  return <div className="auth-shell">
    <header className="auth-header"><Brand /><div className="auth-header-actions"><Link to="/" className="back-home"><ArrowLeft size={15} /> Back to home</Link><ThemeToggle /></div></header>
    <main className={`auth-layout${registering ? " registration-layout" : ""}`}>
      <aside className="auth-story" aria-label="DentIQ AI for your practice" tabIndex={0}>
        <div className="story-content"><div className="story-badge"><span /> BUILT FOR BETTER DENTAL CARE</div>
          <h1>Your expertise.<br />Our intelligence.<br /><span>Better smiles.</span></h1>
          <p>More time for your patients. Less time on the everyday. Bring your dental practice together with DentIQ AI.</p>
          <div className="practice-illustration" role="img" aria-label="Illustration of a connected dental practice with appointments, patient records and care planning">
            <div className="illustration-orbit orbit-one" /><div className="illustration-orbit orbit-two" />
            <div className="tooth-tile"><svg viewBox="0 0 120 140" aria-hidden="true"><path d="M60 24C42 10 18 17 17 43c-1 19 11 29 14 48 3 18 7 31 15 30 9-1 5-35 14-35s5 34 14 35c8 1 12-12 15-30 3-19 15-29 14-48-1-26-25-33-43-19Z" fill="currentColor"/><path d="M60 24c7 5 14 7 21 5" fill="none" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round"/></svg><span className="tooth-spark"><Sparkles size={21} /></span></div>
            <div className="practice-float appointment-float"><span className="float-icon"><CalendarDays size={20} /></span><span><strong>A more organized day</strong><small>Appointments, all in one place</small></span><span className="float-check"><Check size={13} /></span></div>
            <div className="practice-float care-float"><span className="float-icon"><HeartPulse size={20} /></span><span><strong>Patient-first care</strong><small>Connected at every step</small></span></div>
            <div className="illustration-dot dot-one" /><div className="illustration-dot dot-two" />
          </div>
          <div className="story-features"><div><Users size={19} /><span>Patient management</span></div><div><Stethoscope size={19} /><span>Smarter practice workflows</span></div><div><ShieldCheck size={19} /><span>Care that stays connected</span></div></div>
        </div>
        <div className="story-bottom"><span className="story-bottom-icon"><Sparkles size={17} /></span><span>Thoughtfully built for the way you care.</span><ArrowUpRight size={17} /></div>
      </aside>
      <section className={"auth-form-panel"+(doctorRegistration?" doctor-onboarding-panel":"")} aria-label="Dentiq AI account" tabIndex={0}><Outlet /></section>
    </main>
    <footer className="auth-footer"><span>© {new Date().getFullYear()} DentIQ AI. All rights reserved.</span><div><PolicyLink policy="privacy">Privacy Policy</PolicyLink><PolicyLink policy="terms">Terms & Conditions</PolicyLink></div></footer>
  </div>;
}
