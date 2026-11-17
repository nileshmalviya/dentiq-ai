import { usePatientTranslation } from '../../i18n/PatientLanguage';
import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { Field, FormNotice } from "./AuthFields";
import { authService } from "../../services/auth.service";
import { emailIsValid, focusFirstError } from "./validation";

export function ForgotPasswordPage() {
  const { tr } = usePatientTranslation();

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") || "").trim();
    setMessage(""); setError("");
    if (!emailIsValid(email)) { setError("Enter a valid email address."); focusFirstError(form, { email: "invalid" }); return; }
    setPending(true);
    try { await authService.forgotPassword(email); setSuccess(true); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to request a reset link. Please try again."); }
    finally { setPending(false); }
  }
  return <div className="auth-form-content recovery-content"><span className="recovery-icon">{success ? <CheckCircle2 size={27} /> : <KeyRound size={27} />}</span><div className="form-intro"><span className="form-kicker">{tr("ACCOUNT RECOVERY")}</span><h2>{tr(success ? "Check your inbox" : "Forgot your password?")}</h2><p>{tr(success ? "If an account exists with that email, you’ll receive a password reset link shortly. Check your spam folder too." : "It happens. Enter the email associated with your doctor account and we’ll help you get back to your practice.")}</p></div>
    {success ? <div role="status"><FormNotice success message="Your request has been received. Follow the instructions in your email if your account is eligible." /><button type="button" className="text-link recovery-retry" onClick={() => { setSuccess(false); setMessage(""); }}>{tr("Use a different email")}</button></div> : <form onSubmit={submit} noValidate aria-busy={pending}><fieldset className="form-fields" disabled={pending}><Field label={tr("Email address")} name="email" type="email" autoComplete="email" placeholder={tr("doctor@example.com")} required error={tr(error)} icon={<Mail size={18} />} /><FormNotice message={tr(message)} /><button className="auth-primary" type="submit">{pending ? <><LoaderCircle size={18} className="loading-icon" />{tr("Sending reset link…")}</> : <>{tr("Send reset link")}<ArrowRight size={18} /></>}</button></fieldset></form>}
    <p className="auth-switch"><Link className="text-link" to="/login"><ArrowLeft size={15} />{tr("Back to login")}</Link></p>
  </div>;
}
