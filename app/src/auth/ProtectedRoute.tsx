import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./useAuth";
import { hasRole,accountHome } from "./permissions";
import type { Role } from "./permissions";

function ProtectedRoute({ role, children,allowRegistration=false }: { role: Role; children?: ReactNode;allowRegistration?:boolean }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!hasRole(user, role)) return <Navigate to="/unauthorized" replace />;
  if(role==='doctor'&&user.registrationManaged&&user.doctorAccess!==true&& !allowRegistration)return <Navigate to={accountHome(user)} replace />;
  return children || <Outlet />;
}
export function SuperAdminRoute({ children }: { children?: ReactNode }) { return <ProtectedRoute role="super-admin">{children}</ProtectedRoute>; }
export function DoctorRoute({ children }: { children?: ReactNode }) { return <ProtectedRoute role="doctor">{children}</ProtectedRoute>; }
export function PatientRoute({ requireLogin = false }: { requireLogin?: boolean }) {
  return requireLogin ? <ProtectedRoute role="patient" /> : <Outlet />;
}

export function DoctorOnboardingRoute(){return <ProtectedRoute role="doctor" allowRegistration />;}
