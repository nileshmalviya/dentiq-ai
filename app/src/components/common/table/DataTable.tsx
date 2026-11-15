import { ArrowDown, ArrowDownUp, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "../../platform/PlatformUI";
import { TablePagination, TableToolbar } from "./TableControls";
import type { TableController } from "./types";

export function DataTable<T>({ table, rowKey, label, actions, compact = false, className = "" }: { table: TableController<T>; rowKey: (row: T) => string; label: string; actions?: ReactNode; compact?: boolean; className?: string }) {
  return <div className={`data-table${compact ? " compact-data-table" : ""} ${className}`}><TableToolbar table={table} searchLabel={`Search ${label}`} actions={actions} /><div className="table-scroll" role="region" aria-label={`${label} table, scroll horizontally if needed`} tabIndex={0}><table className="p-table" aria-label={`${label} records`}><thead><tr>{table.columns.map(column => {
    const sortable = Boolean(column.value && column.sortable !== false), direction = table.sort?.id === column.id ? table.sort.direction : undefined;
    return <th key={column.id} scope="col" className={column.className} aria-sort={sortable ? direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none" : undefined}>{sortable ? <button className="sortable-heading" type="button" onClick={() => table.toggleSort(column.id)} aria-label={`${column.label}: ${direction === "asc" ? "sort descending" : direction === "desc" ? "restore default order" : "sort ascending"}`}><span>{column.label}</span>{direction === "asc" ? <ArrowUp size={13} /> : direction === "desc" ? <ArrowDown size={13} /> : <ArrowDownUp size={13} />}</button> : <span className="plain-heading">{column.label}</span>}</th>;
  })}</tr></thead><tbody>{table.pageRows.map(row => <tr key={rowKey(row)}>{table.columns.map(column => <td key={column.id} className={column.className}>{column.render ? column.render(row) : String(column.value?.(row) ?? "—")}</td>)}</tr>)}{!table.pageRows.length && <tr><td colSpan={table.columns.length}><EmptyState title="No matching records" description="Try a different search, adjust the filters, or clear them to see all available records." /></td></tr>}</tbody></table></div><TablePagination table={table} /></div>;
}
