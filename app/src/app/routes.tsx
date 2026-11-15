import DoctorRegister from '../pages/doctor/Register';
import VerifyEmail from '../pages/doctor/VerifyEmail';
import VerificationRequest from '../pages/doctor/VerificationRequest';
import RegistrationStatus from '../pages/doctor/RegistrationStatus';
import {DoctorOnboardingRoute} from '../auth/ProtectedRoute';
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { DoctorLayout } from "../layouts/DoctorLayout";
import { SuperAdminLayout } from "../layouts/SuperAdminLayout";
import { PatientLayout } from "../layouts/PatientLayout";
import { DoctorRoute, PatientRoute, SuperAdminRoute } from "../auth/ProtectedRoute";
import Login from "../pages/auth/Login";
import { Unauthorized } from "../pages/auth/Unauthorized";
import { RegisterPage } from "../modules/auth/RegisterPage";
import { ForgotPasswordPage } from "../modules/auth/ForgotPasswordPage";
import { AIChat } from "../pages/patient/AIChat";
import PatientHome from "../pages/patient/Home";
import Recommendations from "../pages/patient/Recommendations";
import DoctorProfile from "../pages/patient/DoctorProfile";
import BookAppointment from "../pages/patient/BookAppointment";
import PatientRecords from "../pages/patient/Records";
import PatientProfile from "../pages/patient/Profile";
import DoctorDashboard from "../pages/doctor/Dashboard";
import DoctorAppointments from "../pages/doctor/Appointments";
import DoctorPatients from "../pages/doctor/Patients";
import ClinicalNotes from "../pages/doctor/ClinicalNotes";
import Consultations from "../pages/doctor/Consultations";
import TreatmentPlans from "../pages/doctor/TreatmentPlans";
import Billing from "../pages/doctor/Billing";
import Inventory from "../pages/doctor/Inventory";
import DoctorReports from "../pages/doctor/Reports";
import DoctorSettings from "../pages/doctor/Settings";
import SuperAdminDashboard from "../pages/super-admin/Dashboard";
import DoctorsManagement from "../pages/super-admin/Doctors";
import PatientsManagement from "../pages/super-admin/Patients";
import ClinicsManagement from "../pages/super-admin/Clinics";
import AllAppointments from "../pages/super-admin/Appointments";
import AIEngine from "../pages/super-admin/AIEngine";
import Services from "../pages/super-admin/Services";
import Analytics from "../pages/super-admin/Analytics";
import SuperAdminReports from "../pages/super-admin/Reports";
import SuperAdminSettings from "../pages/super-admin/Settings";
import { AdminLegacyRedirect, LegacyRedirect, NotFound } from "../modules/navigation/RouteHelpers";

export const appRoutes: RouteObject[] = [
  { element: <PatientRoute />, children: [{ element: <PatientLayout />, children: [
    { path: "/", element: <AIChat /> },
    { path: "/patient", children: [
      { index: true, element: <Navigate to="chat" replace /> },
      { path: "chat", element: <AIChat /> }, { path: "home", element: <PatientHome /> },
      { path: "recommendations", element: <Recommendations /> }, { path: "doctor/:id", element: <DoctorProfile /> },
      { path: "booking", element: <BookAppointment /> },
      { element: <PatientRoute requireLogin />, children: [{ path: "records", element: <PatientRecords /> }, { path: "profile", element: <PatientProfile /> }] },
    ] },
  ] }] },
  { element: <DoctorRoute />, children: [{ path: "/doctor", element: <DoctorLayout />, children: [
    { index: true, element: <Navigate to="dashboard" replace /> }, { path: "dashboard", element: <DoctorDashboard /> },
    { path: "appointments", element: <DoctorAppointments /> }, { path: "patients", element: <DoctorPatients /> },
    { path: "clinical-notes", element: <ClinicalNotes /> }, { path: "consultations", element: <Consultations /> },
    { path: "treatment-plans", element: <TreatmentPlans /> }, { path: "billing", element: <Billing /> },
    { path: "inventory", element: <Inventory /> },
    { path: "reports", element: <DoctorReports /> }, { path: "settings", element: <DoctorSettings /> }, { path: "*", element: <NotFound /> },
  ] }] },
  { element: <SuperAdminRoute />, children: [{ path: "/super-admin", element: <SuperAdminLayout />, children: [
    { index: true, element: <Navigate to="dashboard" replace /> }, { path: "dashboard", element: <SuperAdminDashboard /> },
    { path: "doctors", element: <DoctorsManagement /> }, { path: "clinics", element: <ClinicsManagement /> },
    { path: "patients", element: <PatientsManagement /> }, { path: "appointments", element: <AllAppointments /> },
    { path: "ai-engine", element: <AIEngine /> }, { path: "services", element: <Services /> },
    { path: "analytics", element: <Analytics /> }, { path: "reports", element: <SuperAdminReports /> }, { path: "settings", element: <SuperAdminSettings /> }, { path: "*", element: <NotFound /> },
  ] }] },
  { element: <AuthLayout />, children: [{path:'/doctor/register',element:<DoctorRegister/>},{element:<DoctorOnboardingRoute/>,children:[{path:'/doctor/verify-email',element:<VerifyEmail/>},{path:'/doctor/verification-request',element:<VerificationRequest/>},{path:'/doctor/registration-status',element:<RegistrationStatus/>}]},{ path: "/login", element: <Login /> }, { path: "/register", element: <RegisterPage /> }, { path: "/forgot-password", element: <ForgotPasswordPage /> }] },
  { path: "/unauthorized", element: <Unauthorized /> },
  { path: "/admin/*", element: <AdminLegacyRedirect /> },
  { path: "/find-a-dentist", element: <Navigate to="/patient/recommendations" replace /> },
  { path: "/dentists/:id", element: <LegacyRedirect area="dentist" /> },
  { path: "/clinics/:id", element: <Navigate to="/super-admin/clinics" replace /> },
  { path: "/app/*", element: <LegacyRedirect area="app" /> }, { path: "/clinic/*", element: <LegacyRedirect area="clinic" /> },
  { path: "*", element: <NotFound /> },
];
