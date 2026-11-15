import { Link, Outlet } from "react-router-dom";
import { Brand } from "../components/common/Brand";
import { ThemeToggle } from "../components/common/ThemeToggle";

export function PublicLayout() {
  return (
    <div className="public-shell">
      <header className="public-header">
        <Brand />
        <nav><Link to="/find-a-dentist">Find a dentist</Link><Link to="/login">Log in</Link><Link className="button-link" to="/register">Get started</Link><ThemeToggle /></nav>
      </header>
      <main className="public-main"><Outlet /></main>
    </div>
  );
}
