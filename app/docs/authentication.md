> Historical UI notes. Current API integration and setup are documented in [the project README](../../README.md) and [API coverage](../../api/docs/api-coverage.md). Paths below are relative to app/.

﻿# Demo authentication and portal permissions

Demo accounts and role destinations are documented in the root README (../../README.md) and defined in `src/data/mockUsers.ts`. `/login` pre-fills the selected Super Admin, Doctor or Patient credentials. `authService.login` performs a local match and returns a public user record without the password. `AuthProvider` saves only the known mock user ID in sessionStorage, or localStorage with Remember Me, so refresh restores the correct demo role. Sign out removes both saved IDs.

`SuperAdminRoute` and `DoctorRoute` allow only their matching roles. Guests are redirected to `/login`, wrong-role users to `/unauthorized`. `PatientRoute` permits the public chatbot and appointment flow while requiring the Patient identity for personal records and profile. Legacy admin URLs pass into the same guarded Super Admin routes. Role state is initialized before protected content renders.

Each portal has dedicated layout/header/sidebar components. Cross-portal role-switch menus and the login-bypass link have been removed. Doctor data is selected by doctor and patient assignment IDs in `usePortalData`; Super Admin sees the complete demo arrays. Patient records are scoped to the Patient account.

These are demonstration UI checks, not server-side security. Public demo credentials and mock records are bundled in the frontend. Production RBAC must be enforced by authenticated backend APIs, including permission checks on every request. No tokens, passwords, backend calls or external authentication providers are used here.

Registration, recovery and social sign-in keep their existing UI but remain disconnected. No real account or reset email is generated. No test cases were added or executed for this refactor.
