import { useId, useRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Upload } from "lucide-react";
import { policyUrl } from "../../services/auth.service";
import { passwordRules } from "./validation";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string; icon?: ReactNode; wide?: boolean };

export function Field({ label, error, hint, icon, wide, ...props }: FieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const password = props.type === "password";
  return <div className={`auth-field${wide ? " field-wide" : ""}`}>
    <label htmlFor={id}>{label}{props.required && <span className="required-mark" aria-hidden="true"> *</span>}</label>
    <div className={`input-wrap${icon ? " has-icon" : ""}`}>
      {icon && <span className="input-icon" aria-hidden="true">{icon}</span>}
      <input {...props} id={id} type={password && visible ? "text" : props.type} className={password ? "password-input" : undefined} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} />
      {password && <button type="button" className="password-toggle" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
    </div>
    {error ? <span className="field-error" id={`${id}-error`}>{error}</span> : hint && <span className="field-hint" id={`${id}-hint`}>{hint}</span>}
  </div>;
}

export function PasswordStrength({ value }: { value: string }) {
  const score = passwordRules.filter(rule => rule.test(value)).length;
  return <div className="password-strength field-wide" aria-live="polite">
    <div className="strength-bars" aria-hidden="true">{passwordRules.map((rule, index) => <span className={index < score ? "filled" : ""} key={rule.label} />)}</div>
    <span>{value ? `Password strength: ${["Needs improvement", "Weak", "Fair", "Good", "Strong"][score]}` : "Create a strong password"}</span>
    <ul>{passwordRules.map(rule => <li key={rule.label} className={rule.test(value) ? "rule-met" : ""}>{rule.test(value) ? "✓ " : "○ "}{rule.label}</li>)}</ul>
  </div>;
}

export function UploadField({ name, label, accept, hint, error }: { name: string; label: string; accept: string; hint: string; error?: string }) {
  const id = useId();
  const [filename, setFilename] = useState("");
  return <div className="auth-field upload-field">
    <label htmlFor={id}>{label} <span className="optional-label">(optional)</span></label>
    <div className="upload-box"><Upload size={20} aria-hidden="true" /><span>{filename || "Choose a file"}</span><input id={id} name={name} type="file" accept={accept} onChange={event => setFilename(event.target.files?.[0]?.name || "")} aria-invalid={Boolean(error)} aria-describedby={`${id}-help`} /></div>
    <span id={`${id}-help`} className={error ? "field-error" : "field-hint"}>{error || hint}</span>
  </div>;
}

export function FormNotice({ message, success = false }: { message: string; success?: boolean }) {
  if (!message) return null;
  return <div className={`form-notice ${success ? "notice-success" : "notice-error"}`} role={success ? "status" : "alert"} tabIndex={-1}>{success ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}<span>{message}</span></div>;
}

export function PolicyLink({ policy, children }: { policy: "terms" | "privacy"; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const url = policyUrl(policy);
  if (url) return <a className="text-link" href={url} target="_blank" rel="noopener noreferrer">{children}<span className="sr-only"> (opens in a new tab)</span></a>;
  return <><button type="button" className="text-link policy-button" onClick={() => dialog.current?.showModal()}>{children}</button>
    <dialog ref={dialog} className="policy-dialog" aria-labelledby={titleId}><h2 id={titleId}>{children}</h2><p>This policy has not been published yet. Please contact DentIQ AI for the current {policy === "terms" ? "terms and conditions" : "privacy policy"} before creating an account.</p><button type="button" className="auth-primary" autoFocus onClick={() => dialog.current?.close()}>Close</button></dialog>
  </>;
}
