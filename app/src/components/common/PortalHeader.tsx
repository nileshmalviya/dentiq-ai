import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { Avatar, NotificationButton } from "../platform/PlatformUI";
import { ThemeToggle } from "./ThemeToggle";
import type { HeaderProps } from "./PortalFrame";
export function PortalHeader({ menuOpen, onMenuToggle, icon, title, searchPath, searchLabel, settingsPath, photo }: HeaderProps & { icon: ReactNode; title: string; searchPath: string; searchLabel: string; settingsPath: string; photo?: string }) {
  const [query, setQuery] = useState(""); const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth(); const navigate = useNavigate();
  function search(event: FormEvent) { event.preventDefault(); if (query.trim()) { navigate(`${searchPath}?q=${encodeURIComponent(query.trim())}`); setQuery(""); } }
  return <header className="dashboard-topbar"><div className="topbar-leading"><button className="p-icon-button menu-toggle" type="button" aria-label="Open navigation" aria-controls="dashboard-navigation" aria-expanded={menuOpen} onClick={onMenuToggle}><Menu size={21} /></button><span>{icon}{title}</span></div><div className="topbar-actions"><form className="topbar-search" onSubmit={search}><input aria-label={searchLabel} placeholder={`${searchLabel}…`} value={query} onChange={event => setQuery(event.target.value)} /><button className="p-icon-button" type="submit" aria-label="Search"><Search size={18} /></button></form><ThemeToggle /><NotificationButton /><div className="profile-menu-root" onKeyDown={event => { if (event.key === "Escape") setProfileOpen(false); }}><button className="profile-menu-trigger" type="button" aria-label="Open account menu" aria-expanded={profileOpen} onClick={() => setProfileOpen(!profileOpen)}><Avatar name={user?.name || title} src={photo} size="small" /><ChevronDown size={13} /></button>{profileOpen && <div className="profile-menu"><strong>{user?.name}</strong><Link to={settingsPath} onClick={() => setProfileOpen(false)}>Account settings</Link><button className="portal-signout" type="button" onClick={() => { logout(); navigate("/login", { replace: true }); }}><LogOut size={14} />Sign out</button></div>}</div></div></header>;
}
