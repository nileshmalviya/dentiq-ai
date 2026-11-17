import { usePatientTranslation } from '../../i18n/PatientLanguage';
import { useState } from "react";
import { socialAuthService } from "../../services/socialAuth.service";
import { useAuth } from "../../auth/useAuth";
import { FormNotice } from "./AuthFields";

function ProviderIcon({ provider }: { provider: "google" | "linkedin" | "facebook" }) {


  if (provider === "google") return <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.61 0-4.83-1.76-5.62-4.13H3.04v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.38 13.91a6 6 0 0 1 0-3.82V7.5H3.04a10 10 0 0 0 0 9l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.96 5.5l3.34 2.59A5.99 5.99 0 0 1 12 5.96Z"/></svg>;
  return <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">{provider === "linkedin" ? <><rect width="24" height="24" rx="3" fill="#0A66C2"/><path fill="white" d="M5 9h3v10H5V9Zm1.5-5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM10 9h2.9v1.4c.6-1 1.5-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.6V19h-3v-5c0-1.2 0-2.8-1.7-2.8s-1.9 1.3-1.9 2.7V19H10V9Z"/></> : <><circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="white" d="M13.7 24V13h3.7l.6-4h-4.3V6.5c0-1.1.3-1.9 2-1.9H18V1.1C17.6 1 16.2 1 14.7 1c-3.3 0-5.5 2-5.5 5.6V9H6v4h3.2v11h4.5Z"/></>}</svg>;
}

export function SocialLogin() {
  const { tr } = usePatientTranslation();

  const { user } = useAuth();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function start(provider: "google" | "linkedin" | "facebook") {
    if (pending) return;
    setError("");
    setPending(true);
    try { await socialAuthService.start(provider); } catch (error) { setError(error instanceof Error ? error.message : "Unable to start social sign-in."); }
    finally { setPending(false); }
  }
  if (user && user.role !== "patient") return null;
  return <><div className="auth-divider"><span>{tr("Patient social login")}</span></div><div className="social-buttons">{(["google", "linkedin", "facebook"] as const).map(provider => <button type="button" key={provider} className="social-button" disabled={pending} onClick={() => start(provider)}><ProviderIcon provider={provider} /><span>{tr("Continue with")} {provider === "linkedin" ? "LinkedIn" : provider[0].toUpperCase() + provider.slice(1)}</span></button>)}</div><FormNotice message={tr(error)} /></>;
}

