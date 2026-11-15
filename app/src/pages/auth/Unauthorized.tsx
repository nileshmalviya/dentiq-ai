import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { roleHome, roleLabels } from "../../auth/permissions";
export function Unauthorized() {
  const { user } = useAuth();
  return <main className="platform not-found-page"><ShieldAlert size={52} className="muted" /><h1>This portal is not available to your account.</h1><p>{user ? `You are signed in as ${roleLabels[user.role]}.` : "Sign in with the appropriate demo account to continue."}</p><Link className="p-button" to={user ? roleHome[user.role] : "/login"}>{user ? "Return to my portal" : "Go to login"}</Link><Link className="p-text-link access-public-link" to="/">Continue to public dental chat</Link></main>;
}
