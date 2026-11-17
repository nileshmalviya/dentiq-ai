import { usePatientTranslation } from '../../i18n/PatientLanguage';
import { useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { tr } = usePatientTranslation();

  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === "dark");
  function toggle() {
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    setDark(next);
    try { localStorage.setItem("dentiq-theme", next ? "dark" : "light"); } catch { /* Storage is optional. */ }
  }
  return <button className="theme-toggle" type="button" onClick={toggle} aria-label={tr(`Switch to ${dark ? "light" : "dark"} mode`)} title={`Switch to ${dark ? "light" : "dark"} mode`}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>;
}
