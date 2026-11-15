# Dentiq AI

This repository contains the existing Dentiq AI application, organized into two application folders. The portals, routes, components, styles, business rules and MongoDB records are preserved.

```text
dentiq-ai/
  api/
    src/                 Express configuration, middleware, routes, services and repositories
    scripts/             Existing seed data and API documentation tools
    docs/                API coverage
    .env                 Private backend configuration (ignored by Git)
    .env.example
    openapi.json
    package.json
    package-lock.json
    tsconfig.json
  app/
    src/                 Existing React portals, components, routing, hooks and API client
    public/              Existing assets, with unchanged /assets URLs
    docs/                Frontend documentation
    .env                 Public frontend configuration (ignored by Git)
    .env.example
    package.json
    package-lock.json
    vite.config.ts
    tsconfig*.json
    tailwind.config.js
    postcss.config.js
    eslint.config.js
  .gitignore
  .nvmrc
  dev.mjs                Combined development launcher
  package.json           Root convenience commands
  package-lock.json
  README.md
```

Use Node.js 24. Install dependencies independently:

```powershell
cd api
npm install
cd ../app
npm install
cd ..
```

Alternatively, run `npm run setup` from the root. Each application has its own package file, lockfile, dependencies and build output. There are no root application dependencies.

Start both applications from the root:

```powershell
npm run dev
```

The launcher waits for the API to connect to MongoDB before starting the React development server. Frontend edits reload automatically. Restart the combined command after backend changes. For separate development terminals:

```powershell
cd api
npm run dev
```

```powershell
cd app
npm run dev
```

The equivalent root shortcuts are `npm run dev:api` and `npm run dev:app`.

- API: `http://localhost:5000`
- APP: `http://localhost:5173`
- Login: `http://localhost:5173/login`
- API health: `http://localhost:5000/health`
- OpenAPI specification: `http://localhost:5000/api-docs`

Backend configuration belongs only in `api/.env`. Copy `api/.env.example` when creating a new environment. Existing MongoDB credentials, JWT secrets, client origin and seed-password settings have been retained locally. The API resolves its environment file for both source execution and compiled execution, independently of the shell's current directory. The database remains `dentiq_ai`; this reorganization does not seed, reset or delete database records.

Frontend configuration belongs in `app/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

`VITE_API_URL` remains a compatible fallback for existing frontend deployments. Only public frontend settings belong in this file. Never copy the MongoDB URI or JWT secrets into the React project. The API allows the configured `CLIENT_URL`, normally `http://localhost:5173`. Refresh cookies remain HttpOnly and SameSite=Strict; use HTTPS on the same site in production. The retained Vite proxy also supports `/api/v1` as a relative frontend API base. Production needs an equivalent reverse proxy when using that relative setting.

Build and check both projects from the root:

```powershell
npm run typecheck
npm run build
```

Or build separately:

```powershell
cd api
npm run typecheck
npm run build
npm start
```

```powershell
cd app
npm run typecheck
npm run build
npm run preview
```

Build outputs are `api/dist/` and `app/dist/`. API startup creates missing indexes without dropping existing collections or indexes. Existing data conflicts must be resolved deliberately. Atlas requires the execution machine's IP to be allowlisted and an appropriately scoped database user.

The insert-only seed command is `npm --prefix api run seed`, or `npm run seed` from the root. Set all three `SEED_*_PASSWORD` settings in the private API environment first. Re-running the seed preserves existing records, passwords and edited login emails; it refuses `NODE_ENV=production`. Current local login emails are `adminuser@gmail.com`, `docteruser@gmail.com`, and `patientuser@gmail.com`; their current passwords are in the corresponding local seed-password settings. An empty database initially uses the original fixture emails. Public registration creates patients, and only a super admin can provision a doctor through the API.

The seed snapshot is stored entirely inside `api/scripts/seed-data.json`, so ordinary seeding works independently of the frontend. The optional snapshot-generation tool, `npm --prefix api run seed:snapshot`, reads the retained fixture definitions from `app/src/data` when intentionally refreshing that snapshot. It does not connect to MongoDB or change records.

[API coverage](api/docs/api-coverage.md) maps the existing pages and actions. [OpenAPI](api/openapi.json) documents the endpoints. Regenerate the specification after building the API with `npm --prefix api run docs`.

All database operations remain behind repository contracts. Services define authorization scopes, validation, filtering, sorting, pagination, aggregations and status transitions; route controllers handle HTTP requests and responses. The frontend's existing API client remains at `app/src/services/apiClient.ts` and communicates only through REST calls. Existing internal frontend folders are retained to avoid unrelated import and routing changes.

JWT access tokens remain in memory; refresh sessions use hashed persisted tokens and HttpOnly cookies. Doctor and patient ownership checks are enforced by the API. Booking uses clinic-local slots with UTC storage and a unique doctor/slot index. Stock adjustments and their history share a transaction. Tables keep server-side search, filtering, sorting and pagination; CSV exports contain the current filtered page. Report revenue means completed appointment fees, not payment-gateway settlement.

The assistant provides rule-based guidance, not a diagnosis, and uses no paid AI. Device-local attachments, missing email/social providers, outbound notification delivery and payment-gateway limitations remain as before. The earlier request to remove test files is retained; this reorganization does not add a test suite.
## Reorganization verification

- Preserved and compared 187 source, asset and API configuration files before removing the old copies. Only the planned environment-loading, API-base configuration and package-script changes differed.
- Backend environment values were copied byte-for-byte into `api/.env`; frontend configuration contains no backend secrets.
- Both independent development commands and the combined root command started successfully.
- All three current logins, authorized portal data, role restrictions, API/CORS access, SPA entries, public assets and frontend environment loading were checked over HTTP.
- Inventory CRUD, concurrent stock-out validation, stock history, availability, concurrent booking, the shared appointment record across all portals, and cancellation passed in an isolated temporary Atlas database. That temporary database was removed afterward; the application's database was unchanged by verification.
- TypeScript checks and production builds passed for both folders. No stale references to the former backend folder were found in the migrated sources or configuration.
- Browser-based visual/mobile interaction checks were not run. Existing UI components, CSS and static assets were preserved; the prior Vite large-bundle warning remains.

## Layer architecture

Backend execution now follows Route -> Controller -> Service -> Repository -> MongoDB. Backend code is organized in controllers/, services/, repositories/, models/, routes/, interfaces/, validations/, middleware/, container/, config/, types/, utils/ and errors/ under api/src/. Frontend requests now pass through app/src/services/apiClient.ts and dedicated feature service files. UI hooks are in app/src/hooks/.

See [backend architecture](api/docs/architecture.md) and [frontend API services](app/docs/api-services.md) for file responsibilities, endpoint coverage and the verification actually performed. Existing endpoints, models/indexes, routes, UI and business rules are retained. No dependencies were added.
