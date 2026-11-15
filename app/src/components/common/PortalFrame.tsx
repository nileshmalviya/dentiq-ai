import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FileText } from "lucide-react";
import { useMediaQuery } from "./useMediaQuery";
export interface SidebarProps { open: boolean; onClose: () => void; drawer?: boolean; }
export interface HeaderProps { menuOpen: boolean; onMenuToggle: () => void; }
export function PortalFrame({ Sidebar, Header, className, name }: { Sidebar: ComponentType<SidebarProps>; Header: ComponentType<HeaderProps>; className: string; name: string }) {
  const [open, setOpen] = useState(false);
  const drawer = useMediaQuery("(max-width: 1023px)");
  const trigger = useRef<HTMLElement | null>(null);
  const { pathname, search } = useLocation();
  useEffect(() => { document.title = `${name} | Dentiq AI`; }, [name, pathname]);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, []);
  useEffect(() => { if (!drawer || !open) return; const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previous; }; }, [drawer, open]);
  useEffect(() => { if (!open && trigger.current) { if (trigger.current.isConnected && trigger.current.getClientRects().length) trigger.current.focus(); trigger.current = null; } }, [open]);
  return <div className={`platform dashboard-shell ${className}`}><a className="skip-link" href="#dashboard-content">Skip to content</a>{drawer && open && <button className="sidebar-backdrop" type="button" tabIndex={-1} onClick={() => setOpen(false)} aria-label="Close navigation" />}<Sidebar open={open} drawer={drawer} onClose={() => setOpen(false)} /><div className="dashboard-workspace" inert={drawer && open}><Header menuOpen={drawer && open} onMenuToggle={() => { if (!open && document.activeElement instanceof HTMLElement) trigger.current = document.activeElement; setOpen(!open); }} /><main id="dashboard-content" className="dashboard-content" key={`${pathname}${search}`}><Outlet /></main><footer className="dashboard-footer"><span>{name} · Dentiq AI</span><span>Frontend role demo · sample data only</span><FileText size={13} /></footer></div></div>;
}
