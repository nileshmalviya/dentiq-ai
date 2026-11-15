> Historical UI notes. Current API integration and setup are documented in [the project README](../../README.md) and [API coverage](../../api/docs/api-coverage.md). Paths below are relative to app/.

# Inventory, table controls and responsive enhancements

## Doctor inventory

The existing guarded Doctor portal now includes **Inventory Management** at `/doctor/inventory`. No portal permissions or login destinations changed. The old `/clinic/inventory` alias also resolves to the new guarded route.

`src/data/inventory.ts` contains 14 items owned by the demo doctor and a separate, excluded item owned by another doctor. The page initializes its in-memory state from the current doctor's ID. Add and edit forms never expose owner fields; new items receive the current doctor and clinic IDs. No inventory is shown in the Super Admin or Patient menus.

Summary cards show total item records, low stock, out of stock, items expiring within 30 days, and the total stock value. All summaries recalculate after edits and stock adjustments. The table includes item ID/name, category, quantity, unit, minimum stock, unit price, total value, expiry date, stock status and actions.

- Add/edit forms validate required names, categories and units; whole-number quantities and minimum stock from 0–1,000,000; and non-negative prices with at most two decimal places, up to 10,000,000 INR.
- Total value uses quantity multiplied by unit price in cents/paise, then formats in INR with two decimal places.
- Zero quantity is Out of Stock. A positive quantity at or below its minimum is Low Stock. Other quantities are In Stock.
- Open an item's details to use **Stock In** or **Stock Out**. Quantities must be positive whole numbers, and stock cannot become negative or exceed the supported maximum.
- Delete always opens a confirmation dialog. View, edit, cancel and delete preserve the existing modal styling.
- Expiry alerts use the current calendar day in Asia/Kolkata. Today through 30 days ahead is Expiring Soon; dates before today are Expired. An omitted expiry date is Not applicable. The fixed sample dates are intentionally in late 2026/2027, so alert counts naturally change over time.
- Alert links apply the corresponding stock or expiry filter. Existing filters remain active until cleared.

All mutations stay in React state and reset when the page is left or refreshed. There is no backend, inventory persistence, supplier integration or purchase ordering.

## Reusable table functionality

`src/components/common/table/` provides:

- `useTableData.ts`: shared search, filter, sort and pagination processing.
- `types.ts`: typed columns, filters and controller interface.
- `DataTable.tsx`: the existing table presentation, accessible sortable headings and horizontal scrolling.
- `TableControls.tsx`: shared search/filter/sort controls and pagination.
- `formatters.ts`: numeric date/time sorting and filter-option helpers.

The processing order is search → filters → sorting → pagination. Search is case-insensitive. Headers cycle ascending → descending → default order. Numeric columns use numeric values; dates and times use numeric date/time values rather than display strings. Equal sort values keep their original order; missing sort values appear last. Card layouts use the same controller with a sort selector instead of column headings.

Pagination defaults to 10, with 10/25/50/100 row options, first/previous/numbered/next/last controls, current-page semantics and filtered record totals. Search, filters, sorting and page-size changes return to page 1. Removing records clamps the current page to an available page. Clear Filters clears search and filter values; it preserves the selected sort order, which can be reset through its header or the Default order selector.

Exports include the complete filtered and sorted result, not only the current page. Empty results show guidance and retain the filter controls.

### Coverage

| Portal | Tables and listings |
| --- | --- |
| Doctor | Dashboard appointment preview, My Appointments, My Patients, clinical-note cards, AI consultations, treatment-plan cards, billing, inventory, reports |
| Super Admin | Doctors, clinics, patients, all appointments, AI Engine queue, services, analytics and monthly reports |
| Patient | Personal record cards and a scoped sample appointment-history table in My Dental Records |

Clinical notes, treatment plans and patient records retain their card layouts. Charts, summary cards and chart legends retain their existing design and are not turned into paginated tables.

`TablePages.tsx` reuses the former screen designs and local actions while replacing duplicated list-processing logic. `DashboardPages.tsx` keeps the existing dashboard/settings implementations and exports the enhanced screens under the same names, so existing page wrappers and routes keep working.

## Responsive behavior and accessibility

Desktop sidebars remain visible at 1024px and above. At 1023px and below they become named navigation dialogs with inert closed content, focus trapping, Escape/backdrop dismissal, focus restoration and background scroll locking. The underlying workspace is inert while a drawer is open.

Tables scroll inside their cards, with sticky action cells where needed. Filters wrap; pagination wraps without dropping navigation controls. The 320px minimum-body overflow from the starter has been removed. KPI/card grids, charts, forms, dialog sizes and touch targets adapt to narrow viewports. New styles use the existing light/dark tokens. Modals retain native dialog focus handling and Escape support, lock background scrolling, and only dismiss backdrop clicks outside their bounds.

The inventory layout was visually reviewed at 320, 375, 425, 768, 1024 and 1440px. Representative Doctor, Super Admin and Patient screens were also reviewed, including notes, plans, reports, records, recommendations, profile, chat and booking. Manual browser interaction covered inventory editing, stock limits, confirmation, pagination, sorting, combined filtering, light/dark appearance and drawer focus behavior. No automated test cases or test runner were created or executed for this work.

## Main files

- `src/pages/doctor/Inventory.tsx`, `src/modules/inventory/`, `src/data/inventory.ts`.
- `src/components/common/table/`, `src/components/common/DetailList.tsx`.
- `src/modules/dashboard/TablePages.tsx`, `DashboardPages.tsx`, `src/components/platform/AppointmentTable.tsx`, `TopTreatments.tsx`.
- `src/modules/patient/RecordsListing.tsx`, `PatientPages.tsx`.
- `src/components/common/PortalFrame.tsx`, `PortalSidebar.tsx`, `useMediaQuery.ts`.
- `src/components/platform/PlatformUI.tsx` for the shared modal behavior.
- `src/styles/tables.css`, `inventory.css`, `responsive.css`, imported from `src/main.tsx`.
- `src/app/routes.tsx`, `src/components/doctor/DoctorSidebar.tsx`, `src/modules/navigation/RouteHelpers.tsx` for the inventory navigation addition.
