import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, LoaderCircle, Stethoscope, UserRound } from "lucide-react";
import { Field, FormNotice, PasswordStrength, PolicyLink } from "./AuthFields";
import { authService } from "./authService";
import { focusFirstError } from "./validation";
import type { Errors } from "./validation";

export function RegisterPage() {
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const next: Errors = {};
    if(String(data.get("password")).length < 12) next.password = "Use at least 12 characters.";
    if(data.get("password") !== data.get("confirmPassword")) next.confirmPassword = "Passwords must match.";
    setErrors(next); setMessage("");
    if (Object.keys(next).length) { setMessage("Please check the highlighted fields before continuing."); focusFirstError(form, next); return; }
    data.delete("confirmPassword");
    data.set("termsAccepted", "true");
    for (const [key, value] of data.entries()) {
      if (typeof value === "string" && key !== "password") data.set(key, value.trim());
      if (value instanceof File && !value.name) data.delete(key);
    }
    setPending(true);
    try { await authService.register(data); setPassword(""); setSuccess(true); window.scrollTo({ top: 0, behavior: "instant" }); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create your account. Please try again."); }
    finally { setPending(false); }
  }
  if (success) return <div className="auth-form-content success-screen" role="status"><span className="success-icon"><CheckCircle2 size={32} /></span><h2>Your registration is submitted</h2><p>Your patient account is ready. Sign in to book appointments and view your records.</p><Link className="auth-primary" to="/login">Go to login <ArrowRight size={18} /></Link></div>;
  return <div className="auth-form-content register-content"><div className="form-intro"><span className="form-kicker"><Stethoscope size={15} /> JOIN DENTIQ AI</span><h2>A better day at your practice<br className="desktop-break" /> starts here.</h2><p>Create your patient account. Let’s make room for better care.</p></div>
    <form onSubmit={submit} noValidate aria-busy={pending}>
      <fieldset className="form-fields" disabled={pending}>
        <div className="form-section-title"><span><UserRound size={17} /></span><div><h3>Personal information</h3><p>A few details to get to know you.</p></div><small>01</small></div>
        <div className="form-grid">
          <Field label="Full name" name="fullName" autoComplete="name" placeholder="Dr. full name" required error={errors.fullName} wide maxLength={120} />
          <Field label="Email address" name="email" type="email" autoComplete="email" placeholder="doctor@example.com" required error={errors.email} />
          <Field label="Mobile number" name="mobile" type="tel" autoComplete="tel" placeholder="+91 98765 43210" required error={errors.mobile} />
          <Field label="Password" name="password" type="password" autoComplete="new-password" placeholder="Create a password" required error={errors.password} onChange={event => setPassword(event.target.value)} />
          <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Re-enter your password" required error={errors.confirmPassword} />
          <PasswordStrength value={password} />
        </div>
        <div className="consent"><div className="consent-line"><input id="terms-accepted" type="checkbox" name="termsAccepted" required aria-invalid={Boolean(errors.termsAccepted)} aria-describedby={errors.termsAccepted ? "consent-error" : undefined} /><div><label htmlFor="terms-accepted">I accept the </label><PolicyLink policy="terms">Terms & Conditions</PolicyLink><span> and acknowledge the </span><PolicyLink policy="privacy">Privacy Policy</PolicyLink><span>.</span></div></div>{errors.termsAccepted && <span className="field-error" id="consent-error">{errors.termsAccepted}</span>}</div>
        <FormNotice message={message} />
        <button type="submit" className="auth-primary">{pending ? <><LoaderCircle size={18} className="loading-icon" /> Creating your account…</> : <>Create Patient Account <ArrowRight size={18} /></>}</button>
      </fieldset>
    </form>
    <p className="auth-switch">Already have an account? <Link to="/login" className="text-link">Login <ArrowRight size={14} /></Link></p>
  </div>;
}
