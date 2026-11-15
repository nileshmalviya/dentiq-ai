# Backend architecture

The backend is organized by technical layer. Existing endpoints, collection names, relationships, indexes, validation behavior and business rules are preserved.

```text
api/src/
  controllers/       HTTP adapters and standardized responses
  services/          Business policies, ownership, queries and transaction coordination
  repositories/      MongoDB access and transactions
  models/            Mongoose schemas, relationships and indexes
  routes/            Authentication/authorization, validation and endpoint wiring
  interfaces/
    services/        Focused controller-facing service contracts
    repositories/    Repository, unit-of-work and repository-registry contracts
  validations/       Existing resource and request schemas
  middleware/        Authentication, authorization, validation, errors and guest ownership
  container/         Repository construction and dependency injection
  config/            Environment and Atlas connectivity
  types/             Actor, role, record and query types
  utils/             Safe query and pagination helpers
  errors/            Business error type
```

Requests follow Route -> Controller -> Service -> Repository -> MongoDB. `container/dependencies.ts` builds controllers and services; `container/repositories.ts` supplies repositories and the unit of work. Routes do not instantiate business services or execute controller callbacks inline.

`resource.controller.ts`, `resource.service.ts` and `mongo.repository.ts` retain the shared CRUD implementation for doctors, clinics, patients, clinical notes, consultations, treatment plans, billing, catalog services, payments, records and inventory history. This avoids duplicating the same CRUD pipeline in empty feature wrappers. Resource policies and pagination remain in the service layer. MongoDB applies prepared criteria, sorting, skip/limit and aggregations in repositories.

Dedicated appointment and inventory services retain availability, transitions, stock validation and metrics. `appointment.repository.ts` owns booking persistence and status updates; `inventory.repository.ts` owns atomic stock updates and movement-history transactions. The unit of work delegates these operations and also coordinates account provisioning and linked-profile writes. No service or controller imports a Mongoose model or concrete repository.

Auth controllers manage only transport details, including refresh cookies. Auth services preserve hashing, JWT validation, session rotation and account status checks. Chat and recommendation services are separate injected services. Guest conversation ownership is established in middleware. Recommendations still use the existing rule-based logic and stored doctor data.

Routes are split into auth, staff, patient, inventory, public and chat wiring files. Staff wiring preserves the exact existing admin and doctor resource permissions. Shared dashboard data still powers the existing dashboard, reports and analytics endpoints. The route registry is unchanged: 139 HTTP method/path combinations.

Verification performed during the refactor:

- Backend and frontend TypeScript checks and production builds.
- Exact route-contract comparison against the pre-refactor OpenAPI specification.
- Model/index/reference/collection-definition comparison.
- Isolated HTTP checks for auth, refresh rotation/replay protection, validation, RBAC, ownership, all portal listings/summaries/settings/reports, combined search/filter/sort/pagination, inventory CRUD and concurrency/history, appointment conflicts/transitions/shared records, and private chat conversations.
- Additional CRUD checks for doctor/clinic management, provisioning, patient registration/profile/favorites, settings, patients, services, notes, consultations, treatment plans, billing and records.

Verification uses temporary Atlas databases, removed after completion. The main application database is not reset or seeded by the refactor. No persistent test suite was added: earlier test files had been removed at the user's request. Browser interaction/visual checks were not performed.
During final live verification, ports 5000 and 5173 were occupied by processes that could not be confirmed as belonging to this workspace. Those processes were left untouched. The refactored API and APP were verified on temporary ports 5001 and 5174 using process-only overrides, then stopped. Normal package commands and environment-file values remain unchanged. Restart the intended development servers to load the refactored files.
