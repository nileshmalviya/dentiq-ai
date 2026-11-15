import { Link, Navigate, useLocation, useParams } from "react-router-dom";

export function LegacyRedirect({ area }: { area: "app" | "clinic" | "dentist" }) {
  const { pathname, search } = useLocation();
  const params = useParams();
  const part = pathname.split("/")[2] || "";
  if (area === "dentist") return <Navigate replace to={`/patient/doctor/${params.id === "dentist-001" ? "arjun-mehta" : params.id === "dentist-002" ? "neha-sharma" : params.id === "dentist-003" ? "priya-patel" : params.id || "arjun-mehta"}`} />;
  const patientMap: Record<string, string> = { "": "home", discover: "recommendations", appointments: "booking", book: "booking", "booking-confirmation": "booking", records: "records", "treatment-plans": "records", profile: "profile", settings: "profile" };
  const doctorMap: Record<string, string> = { "": "dashboard", appointments: "appointments", patients: "patients", "dental-chart": "patients", "treatment-plans": "treatment-plans", billing: "billing", reports: "reports", settings: "settings", staff: "patients", chairs: "dashboard", instruments: "dashboard", sterilization: "dashboard", inventory: "inventory" };
  return <Navigate replace to={area === "app" ? `/patient/${patientMap[part] || "home"}${search}` : `/doctor/${doctorMap[part] || "dashboard"}${search}`} />;
}

export function NotFound() { return <div className="platform not-found-page"><span>404</span><h1>This page is taking a little detour.</h1><p>Let’s get you back to your dental care dashboard.</p><Link className="p-button" to="/patient/home">Back to Dentiq AI</Link></div>; }
export function AdminLegacyRedirect() {
  const params = useParams();
  const parts = (params["*"] || "dashboard").split("/");
  const aliases: Record<string, string> = { dentists: "doctors", reviews: "analytics", subscriptions: "reports" };
  parts[0] = aliases[parts[0]] || parts[0] || "dashboard";
  return <Navigate replace to={`/super-admin/${parts.join("/")}`} />;
}
