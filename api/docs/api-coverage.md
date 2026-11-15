# Frontend/API coverage

Paths below are relative to `/api/v1`. Common table controls send `page`, `limit`, `search`, `sortBy`, `sortOrder` and selected filters. Page sizes are 10, 25, 50 and 100. Existing mock files remain for seed provenance and type compatibility; active portal business records come from APIs.

| Existing route or feature | Backend integration |
| --- | --- |
| `/`, `/patient/chat` | `POST /ai-chat/message`, `POST /recommendations/doctors`; persisted owner-protected conversations |
| `/patient/home` | `GET /public/services`; authenticated appointment preview |
| `/patient/recommendations` | `POST /recommendations/doctors` with concern and search; stored active doctors |
| `/patient/doctor/:id` | `GET /public/doctors/:id`; stored reviews; `GET /patient/favorites`, `PUT/DELETE /patient/favorites/:id` |
| `/patient/booking` | `GET /public/doctors/:id/availability`, `POST /public/appointments`; authenticated or guest booking; atomic slot conflicts |
| `/patient/records` | `GET /patient/records`, `GET /patient/appointments`; patient scope enforced on the server |
| `/patient/profile` | `GET/PATCH /patient/profile`; linked account contact synchronization |
| `/login` | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`; role-specific redirect |
| `/register` | `POST /auth/register`; PATIENT-only public registration |
| `/forgot-password`, social buttons | Explicit missing-provider response; no fabricated email or social session |
| `/doctor/dashboard` | `GET /doctor/dashboard`, `/doctor/appointments`, `/doctor/clinical-notes?followUpDue=true`; actual metrics and utilization |
| `/doctor/appointments` | `GET /doctor/appointments`, `/doctor/appointments/summary`; same underlying booking records |
| `/doctor/patients` | `GET /doctor/patients`, `/:id`; assigned patients only |
| `/doctor/clinical-notes` | `GET/POST /doctor/clinical-notes`, `PATCH /doctor/clinical-notes/:id`; assignment validation |
| `/doctor/consultations` | `GET /doctor/consultations`, `/summary`, `PATCH /doctor/consultations/:id` for review |
| `/doctor/treatment-plans` | `GET/POST /doctor/treatment-plans`, `PATCH /doctor/treatment-plans/:id`; progress validation |
| `/doctor/billing` | `GET /doctor/billing`, `/summary`; actual invoice totals and current-page CSV |
| `/doctor/inventory` | `GET/POST /inventory`, `GET/PATCH/DELETE /inventory/:id`, `POST /inventory/:id/stock-in`, `/stock-out`, `GET /inventory/summary`, `/low-stock`, `/expiring-soon`, `/transactions` |
| `/doctor/reports` | `GET /doctor/reports?days=30` or `90`; stored appointment aggregates |
| `/doctor/settings` | `GET/PATCH /doctor/settings`; persisted profile/contact and preferences |
| `/super-admin/dashboard` | `GET /admin/dashboard?days=30` or `90`, `GET /admin/clinics`; actual counts and distributions |
| `/super-admin/doctors` | `GET/POST /admin/doctors`, `GET/PATCH/DELETE /admin/doctors/:id`; edits persist; provisioning API creates account transactionally |
| `/super-admin/patients` | `GET/POST /admin/patients`, `GET/PATCH/DELETE /admin/patients/:id` |
| `/super-admin/clinics` | `GET/POST /admin/clinics`, `GET/PATCH/DELETE /admin/clinics/:id`; membership counts calculated from records |
| `/super-admin/appointments` | `GET /admin/appointments`, `/summary`, `PATCH /admin/appointments/:id`; status transition rules |
| `/super-admin/ai-engine` | `GET /admin/consultations`, `/summary`, `PATCH /admin/consultations/:id`; rule-based source identified |
| `/super-admin/services` | `GET /admin/services`, `PATCH /admin/services/:id`; public availability follows saved status |
| `/super-admin/analytics` | `GET /admin/analytics?days=30` or `90` |
| `/super-admin/reports` | `GET /admin/reports?days=30` or `90`; aggregated records and current-table CSV |
| `/super-admin/settings` | `GET/PATCH /admin/settings`; persisted profile/preferences |
| Header search | Existing `q` navigation parameter becomes server `search` in the destination directory |
| Notification popover | Latest authorized appointment; no fabricated notification |
| Theme, drawers and tabs | Existing presentation behavior retained; theme remains device-local |
| Legacy links | Existing redirect routes retained |

Models use stable string IDs to preserve existing routes and seed relationships, with indexed reference fields. Medical records are never included in public doctor or guest booking responses.

Browser-based visual/responsive verification has not been performed in this session.

API request execution is now centralized under app/src/services; shared data hooks live in app/src/hooks/useResource.ts. See [backend architecture](architecture.md) and [frontend API service mapping](../../app/docs/api-services.md).
