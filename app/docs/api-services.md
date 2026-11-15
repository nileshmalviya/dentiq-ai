# Frontend API service layer

The existing UI, routes, guards, layouts and table behavior remain intact. API access follows Component -> Hook -> Frontend Service -> API Client -> REST API. Event handlers can also invoke the relevant frontend service directly.

`src/services/apiClient.ts` is the only file that executes fetch. It handles the configured VITE_API_BASE_URL (with the existing VITE_API_URL fallback), headers, credentials, memory-only access tokens, single-flight refresh/retry, normalized errors and a 15-second request timeout. Common response and pagination types are in `src/types/api.ts`. UI refresh/error events live in `src/utils/apiEvents.ts`.

| Service file | Existing API responsibilities |
| --- | --- |
| auth.service.ts | Login, registration, logout, current user, refresh restoration and recovery/provider behavior |
| doctor.service.ts | Admin/public doctor directory, details and availability reads |
| patient.service.ts | Patient directories, own profile/records/favorites, profile update and saved doctors |
| clinic.service.ts | Clinic directory CRUD |
| appointment.service.ts | Authorized appointment listings/details/status writes and public booking |
| inventory.service.ts | Inventory CRUD, summaries, filters, stock movement and history |
| clinicalNote.service.ts | Clinical notes CRUD |
| consultation.service.ts | Consultation queue and reviews |
| treatmentPlan.service.ts | Plans and progress writes |
| billing.service.ts | Invoices and summaries |
| dentalService.service.ts | Admin/public catalog and availability updates |
| user.service.ts | Admin/doctor account settings and preferences |
| aiChat.service.ts | Chat messages and conversation retrieval |
| recommendation.service.ts | Doctor recommendations |
| dashboard.service.ts | Admin and doctor dashboard data |
| analytics.service.ts | Existing analytics endpoints |
| report.service.ts | Existing reports endpoints |

`resource.service.ts` supplies the shared typed CRUD/response adapter. `resourceRegistry.ts` selects the feature service for an existing endpoint and handles row-change persistence. These shared helpers avoid duplicating HTTP plumbing in every service; feature files own their supported endpoint prefixes and specialized actions.

`src/hooks/useResource.ts` owns loading/error state, debouncing, cancellation of stale state updates, query state and table metadata. It calls frontend services without constructing HTTP requests. `useDashboard.ts` retains the existing dashboard hook. The table controller still captures page sizes 10/25/50/100, search, sort and filters, while the API performs database pagination. Pages no longer import the low-level client or call its api/write functions.

Service verification exercised supported resource routes, query parameters, CRUD dispatch, feature request payloads, credential handling, bearer tokens, deduplicated refresh/retry, API errors and timeout normalization. Static JSX structure/text/attributes were compared across 76 React files; all nine existing stylesheets, route definitions and guards were preserved. Browser-based mobile/visual interaction checks were not run.
