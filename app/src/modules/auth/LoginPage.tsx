import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Field, FormNotice } from "./AuthFields";
import { SocialLogin } from "./SocialLogin";
import { focusFirstError, validateLogin } from "./validation";
import type { Errors } from "./validation";
import { useAuth } from "../../auth/useAuth";
import { accountHome, roleLabels } from "../../auth/permissions";


export function LoginPage() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [remember, setRemember] = useState(() => { try { return localStorage.getItem("dentiq-remember") === "true"; } catch { return false; } });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    const form = event.currentTarget; const next = validateLogin(new FormData(form));
    setErrors(next); setMessage("");
    if (Object.keys(next).length) { setMessage("Please check the highlighted fields."); focusFirstError(form, next); return; }
    setPending(true);
    try { const authenticated = await login(email, password, remember); navigate(accountHome(authenticated), { replace: true }); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to open the demo account."); }
    finally { setPending(false); }
  }
  return <div className="auth-form-content login-content"><div className="form-intro"><span className="form-kicker"><ShieldCheck size={15} /> DENTIQ AI PORTAL LOGIN</span><h2>Welcome back.</h2><p>Sign in to your dedicated portal with your account.</p></div>
    {user && <div className="demo-session-note"><span>Signed in as {roleLabels[user.role]}.</span><Link className="text-link" to={accountHome(user)}>My portal</Link><button type="button" className="text-link policy-button" onClick={logout}>Sign out</button></div>}
    <form onSubmit={submit} noValidate aria-busy={pending}><fieldset className="form-fields" disabled={pending}>
      <Field label="Email address" name="email" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required error={errors.email} icon={<Mail size={18} />} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required error={errors.password} icon={<LockKeyhole size={18} />} />
      <div className="login-options"><label className="checkbox-label"><input type="checkbox" checked={remember} onChange={event => { setRemember(event.target.checked); try { localStorage.setItem("dentiq-remember", String(event.target.checked)); } catch { /* Optional preference. */ } }} />Remember me</label><Link className="text-link" to="/forgot-password">Forgot password?</Link></div>
      <FormNotice message={message} /><button className="auth-primary" type="submit">{pending ? <><LoaderCircle size={18} className="loading-icon" /> Opening portal…</> : <>Login <ArrowRight size={18} /></>}</button>
    </fieldset></form><SocialLogin /><p className="auth-switch">Doctor? <Link className="text-link" to="/doctor/register">Register your practice</Link><br />New patient? <Link className="text-link" to="/register">Registration form</Link><br /><Link className="text-link" to="/">Continue as a patient without login</Link></p><div className="form-footnote"><LockKeyhole size={13} /> Secure access to your clinic portal.</div>
  </div>;
}
