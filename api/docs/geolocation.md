# Clinic location and nearby doctor search

Clinic points live only on `clinics.location`, as GeoJSON `Point` values in `[longitude, latitude]` order. The optional field has a `2dsphere` index, created by the existing startup `ensureIndexes()` flow. No collection reset, seed coordinates, or backfill is required. Old clinics remain valid and remain in the existing non-location directory; they cannot appear in distance searches until a doctor confirms a point.

Registration accepts optional top-level `clinicLocation: { latitude, longitude, confirmed: true }`. It is validated and converted to the clinic point inside the existing registration transaction. Coordinates are not copied to doctor records or registration snapshots. OTP, documents, review states and approval steps are unchanged. Existing clinic address, city, state and postal-code fields are reused.

Approved doctors can use `GET /api/v1/doctor/clinic-locations` and `PATCH /api/v1/doctor/clinic-locations/:id` from Settings. Updates require ownership through the primary clinic, `clinicIds`, or an active `doctor-clinics` link, an active clinic, valid coordinates and explicit confirmation. The PATCH also accepts `address`, `city`, `state`, and `postalCode`. Updating a shared clinic updates the single shared point for all associated doctors. Changing captured coordinates or address fields in the form clears confirmation. No map library exists in this project, so manual coordinate correction is supported without adding a map provider.

`GET /api/v1/public/doctors/nearby` supports:

| Parameter | Meaning |
| --- | --- |
| `latitude`, `longitude` | Both are required for a distance search; finite values within geographic bounds |
| `radiusKm` | Default 20 km; minimum 0.1 km; maximum set by `NEARBY_MAX_RADIUS_KM` (default 100, configurable up to 500) |
| `city` | City/locality search instead of precise coordinates; matches clinic city/address and returns no distance |
| `specialization` | Optional literal specialty search |
| `search` | Optional literal doctor-name/specialty search |
| `concern` | Optional existing dental concern; reuses the existing recommendation matching rules without creating recommendation/chat records |
| `sort` | `distance` (default), `rating`, or `experience`; city searches use name for the default sort |
| `page`, `limit` | Page starts at 1, limit defaults to 10 and is capped at 50 |

The repository starts the clinic aggregation with `$geoNear` for coordinate searches. It filters active clinics, joins approved active doctors eligible for clinical services, requires email verification for self-registered doctors, and supports primary clinics, `clinicIds`, and active membership links. It chooses the nearest clinic per doctor before sorting and paging. Stable doctor/clinic IDs break ties. `$facet` returns a consistent total and bounded page; only that page is enriched with availability. Active legacy doctors without onboarding metadata retain the existing project approval semantics: the admin directory already treats them as approved. Explicit pending/rejected statuses and unverified managed doctors do not qualify. No approval data is migrated or fabricated.

Responses use the existing `{ success, message, data, pagination }` envelope. Doctor cards include matched clinic ID/name/address, specialty, rating, experience, photo, availability and optional `distanceKm`. Distance is straight-line geographic distance, not driving distance. Optional `clinicId` on the existing profile, availability and booking APIs carries the matched clinic through the patient journey; it is checked against the doctor's associations. Requests without it continue using the primary clinic. Appointment slot ownership, timezone conversion, conflict protection and booking rules are retained.

Patient coordinates exist only in the mounted nearby-search hook and the current HTTP request. They never enter database writes, storage, cookies, routing, chat, appointment payloads, error events or analytics. Leaving/clearing the search discards them; in-flight requests and late GPS callbacks are ignored. Location permission is requested only by a click on **Use My Current Location**. Denied, unsupported, unavailable and timed-out location requests offer a manual city/locality search or the original recommendations. New patient UI and errors use the existing Hindi/English catalogs; staff screens remain English.

The nearby endpoint sets `Cache-Control: no-store`, `Pragma: no-cache` and `Referrer-Policy: no-referrer`; its frontend requests also disable caching and referrers. Application code does not log request URLs or queries. Production hosting must use HTTPS and must omit/redact the nearby endpoint's query string from any reverse-proxy/access/monitoring logs, since this required GET API carries transient coordinates in its URL.

Implementation references: [MongoDB `$geoNear`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/geonear/) and [MongoDB `2dsphere` indexes](https://www.mongodb.com/docs/manual/core/indexes/index-types/geospatial/2dsphere/).

## Verification

From the project root:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd --prefix api run test:geolocation
npm.cmd --prefix api run test:patient-language
# With the development server running:
npm.cmd --prefix app run test:geolocation
npm.cmd --prefix app run test:patient-language
```

The backend suite uses an isolated temporary MongoDB replica set through `mongodb-memory-server` (first run downloads a test binary). It verifies actual geospatial queries and index behavior, registration persistence, approval and association checks, no search persistence, secondary-clinic availability, HTTP validation and cache headers. It never connects to Atlas. Browser tests use Playwright geolocation and mocked APIs; they make no real registration, location or booking writes. They exercise explicit permission, confirmation/correction, English/Hindi results, pagination/filters, denied/unavailable/timeout/unsupported fallbacks, storage checks, clinic-preserving booking, and responsive widths. Screenshots go to the ignored `artifacts/geolocation/` directory.

Main changed areas: clinic schema/model/indexes; registration validation and record construction; `clinic-search.repository.ts`, `doctor-search.service.ts`, `clinic-location.service.ts`, `location.controller.ts`; public/staff routing; additive clinic selection in profile/availability/booking; doctor registration/settings fields; `doctor.service.ts`, geolocation/search hooks, nearby patient UI, shared doctor cards, locale catalogs and test scripts.
