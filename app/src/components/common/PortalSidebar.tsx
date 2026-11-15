import { useEffect, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { LogOut, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Brand } from "./Brand";
import { useAuth } from "../../auth/useAuth";
import type { SidebarProps } from "./PortalFrame";
export function PortalSidebar({ open, onClose, drawer = false, home, title, children }: SidebarProps & { home: string; title: string; children: ReactNode }) {
  const { logout } = useAuth(); const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!drawer || !open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.querySelector<HTMLElement>("a[href], button")?.focus();
    return () => { queueMicrotask(() => { if (previous?.isConnected && previous !== document.body && previous.getClientRects().length && !previous.closest("[inert]")) previous.focus(); }); };
  }, [drawer, open]);
  function trapFocus(event: KeyboardEvent<HTMLElement>) {
    if (!drawer || !open || event.key !== "Tab") return;
    const nodes = [...(ref.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]') || [])].filter(node => node.getClientRects().length > 0);
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  return <aside ref={ref} className={`dashboard-sidebar${open ? " is-open" : ""}`} id="dashboard-navigation" role={drawer ? "dialog" : undefined} aria-label={drawer ? title : undefined} aria-modal={drawer && open ? true : undefined} aria-hidden={drawer && !open ? true : undefined} inert={drawer && !open} tabIndex={-1} onKeyDown={trapFocus}><div className="sidebar-brand"><Brand to={home} /><span>{title}</span><button className="sidebar-close p-icon-button" type="button" onClick={onClose} aria-label="Close navigation"><X size={20} /></button></div>{children}<div className="portal-links"><span>{title}</span><button type="button" className="portal-signout" onClick={() => { logout(); navigate("/login", { replace: true }); }}><LogOut size={15} />Sign out</button><small>Demo access · no server-side security</small></div></aside>;
}
