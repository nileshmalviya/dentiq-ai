import { useAuth } from "../../auth/useAuth";
import { useResourceRows } from "../../api/hooks";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, Bell, CalendarDays, Check, CheckCircle2, ClipboardList, Clock3, Grid2X2, Hospital, Search, Sparkles, Star, Stethoscope, UsersRound, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "../common/Brand";

export { ToothMark } from "./ToothMark";

export function Avatar({ name, src, size = "medium" }: { name: string; src?: string; size?: "small" | "medium" | "large" }) {
  return src ? <img className={`p-avatar avatar-${size}`} src={src} alt={name} /> : <span className={`p-avatar avatar-${size} avatar-initials`} aria-label={name}>{name.split(" ").filter(part => part !== "Dr.").slice(0, 2).map(part => part[0]).join("")}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = /progress|review|processing/i.test(status) ? "blue" : /pending|scheduled|follow-up/i.test(status) ? "amber" : /inactive|cancel/i.test(status) ? "slate" : "green";
  return <span className={`status-badge badge-${tone}`}>{/paid|checked|completed|active|reviewed/i.test(status) && !/inactive/i.test(status) ? <Check size={11} /> : <span className="status-dot" />}{status}</span>;
}

export function VerifiedBadge() { return <CheckCircle2 className="verified-icon" size={16} fill="currentColor" aria-label="Verified demo dentist" />; }
export function Rating({ value, reviews }: { value: number; reviews?: number }) { return <span className="rating"><Star size={15} fill="currentColor" /><strong>{value.toFixed(1)}</strong>{reviews !== undefined && <span>({reviews} reviews)</span>}</span>; }

export function NotificationButton() {
  const {user}=useAuth(); const prefix=user?.role === "super-admin"?"/admin":user?.role === "doctor"?"/doctor":"/patient"; const [appointments]=useResourceRows<{id:string;date:string;time:string;status:string}>(user?`${prefix}/appointments?sortBy=appointmentDate&sortOrder=desc`:null);
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function close(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  return <div className="notification-root" ref={root} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}><button type="button" className="p-icon-button notification-button" aria-label="Notifications" aria-expanded={open} onClick={() => { setOpen(!open); setRead(true); }}><Bell size={19} />{!read && <span />}</button>{open && <div className="notification-menu"><strong>Notifications</strong><div><CalendarDays size={18} /><p><b>Your day, at a glance</b><span>{appointments.length ? `${appointments[0].date} ${appointments[0].time}: ${appointments[0].status}` : "No appointment updates."}</span></p></div><small>Demo notification · no live updates</small></div>}</div>;
}

export function PatientHeader({ title, back = "/patient/home", home = false, subtitle, action }: { title?: string; back?: string; home?: boolean; subtitle?: ReactNode; action?: ReactNode }) {
  const {user}=useAuth();
  return <header className={`patient-header${home ? " patient-home-header" : ""}`}>{home ? <Brand /> : <><Link className="p-icon-button" to={back} aria-label="Go back"><ArrowLeft size={21} /></Link><div className="patient-heading"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div></>}{home && <div className="patient-header-actions"><NotificationButton /><Link to="/patient/profile" aria-label="Open profile"><Avatar name={user?.name || "Patient"} size="small" /></Link></div>}{action}</header>;
}

export function PageHeading({ title, description, children }: { title: string; description?: string; children?: ReactNode }) { return <div className="page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{children && <div className="page-heading-actions">{children}</div>}</div>; }
export function Panel({ title, children, action, className = "" }: { title?: string; children: ReactNode; action?: ReactNode; className?: string }) { return <section className={`p-panel ${className}`}>{title && <div className="panel-heading"><h2>{title}</h2>{action}</div>}{children}</section>; }
export function EmptyState({ title = "No results found", description = "Try a different search or filter." }: { title?: string; description?: string }) { return <div className="empty-state"><Search size={28} /><h3>{title}</h3><p>{description}</p></div>; }
export function LocalNotice({ message }: { message: string }) { return message ? <div className="local-notice" role="status"><CheckCircle2 size={17} />{message}</div> : null; }

export function SearchField({ value, onChange, placeholder = "Search…" }: { value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="p-search"><Search size={17} /><span className="sr-only">{placeholder}</span><input type="search" placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} /></label>; }
export function FilterSelect({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[] }) { return <label className="p-filter"><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option}>{option}</option>)}</select></label>; }

export function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { const dialog = ref.current; if (open && !dialog?.open) dialog?.showModal(); if (!open && dialog?.open) dialog.close(); if (!open) return; const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previous; }; }, [open]);
  return <dialog className="p-modal" ref={ref} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target !== event.currentTarget) return; const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); }}><div className="modal-heading"><h2 id={titleId}>{title}</h2><button type="button" className="p-icon-button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button></div>{children}</dialog>;
}

const statIcons = { calendar: CalendarDays, users: UsersRound, clipboard: ClipboardList, followup: Clock3, doctor: Stethoscope, clinic: Hospital, star: Star, grid: Grid2X2, ai: Sparkles };
export function StatCards({ stats }: { stats: { label: string; value: string; icon: string; tone: string }[] }) { return <div className="stat-grid">{stats.map(stat => { const Icon = statIcons[stat.icon as keyof typeof statIcons] || Grid2X2; return <div className="stat-card" key={stat.label}><span className={`stat-icon tone-${stat.tone}`}><Icon size={25} fill={stat.icon === "star" ? "currentColor" : "none"} /></span><div><strong>{stat.value}</strong><span>{stat.label}</span></div></div>; })}</div>; }
