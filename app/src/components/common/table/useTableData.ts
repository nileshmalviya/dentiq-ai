import { remoteMeta } from "../../../hooks/useResource";
import { useEffect, useState } from "react";
import type { TableColumn, TableController, TableFilter, TableSort, SortValue } from "./types";

const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
function compare(a: SortValue, b: SortValue) { return typeof a === "number" && typeof b === "number" ? a - b : collator.compare(String(a), String(b)); }

export function useTableData<T>(rows: T[], options: { columns: TableColumn<T>[]; searchText: (row: T) => string; filters?: TableFilter<T>[]; initialQuery?: string }): TableController<T> {
  const [query, updateQuery] = useState(options.initialQuery || "");
  const [filterValues, updateFilters] = useState<Record<string, string>>({});
  const [sort, updateSort] = useState<TableSort | null>(null);
  const [storedPage, updatePage] = useState(1); const [pageSize, updatePageSize] = useState(10);
  const remote = remoteMeta(rows);
  const filterDefinitions = (options.filters || []).map(filter => remote?.filters?.[filter.id] ? {...filter,options:[{value:"",label:filter.options?.[0]?.label || "All"},...remote.filters[filter.id].map(value=>({value,label:value}))]} : filter);
  const serverQuery = new URLSearchParams({ page: String(storedPage), limit: String(pageSize), ...(query.trim() ? {search:query.trim()}:{}), ...(sort ? {sortBy:sort.id,sortOrder:sort.direction}:{}), ...Object.fromEntries(Object.entries(filterValues).filter(([,v])=>v)) }).toString();
  useEffect(()=>{if(remote)remote.setQuery(serverQuery);},[serverQuery,remote?.endpoint]);
  // Keep the required search -> filters -> sort -> pagination order in one place.
  const normalized = query.trim().toLocaleLowerCase();
  const searched = rows.filter(row => !normalized || options.searchText(row).toLocaleLowerCase().includes(normalized));
  const filtered = searched.filter(row => filterDefinitions.every(filter => !filterValues[filter.id] || filter.matches(row, filterValues[filter.id])));
  const column = options.columns.find(item => item.id === sort?.id);
  const filteredRows = column?.value && sort ? filtered.map((row, index) => ({ row, index })).sort((left, right) => {
    const a = column.value!(left.row), b = column.value!(right.row);
    const missingA = a == null || (typeof a === "number" && !Number.isFinite(a));
    const missingB = b == null || (typeof b === "number" && !Number.isFinite(b));
    if (missingA || missingB) return missingA === missingB ? left.index - right.index : missingA ? 1 : -1;
    return compare(a, b) * (sort.direction === "asc" ? 1 : -1) || left.index - right.index;
  }).map(item => item.row) : filtered;
  const total = remote ? remote.pagination?.totalRecords || 0 : filteredRows.length, totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, storedPage), totalPages), offset = (page - 1) * pageSize;
  function setSort(next: TableSort | null) { updateSort(next); updatePage(1); }
  return {
    loading: remote?.loading, error: remote?.error, columns: options.columns, filterDefinitions, query,
    setQuery: value => { updateQuery(value); updatePage(1); }, filterValues,
    setFilter: (id, value) => { updateFilters(previous => ({ ...previous, [id]: value })); updatePage(1); },
    sort, setSort, toggleSort: id => setSort(sort?.id !== id ? { id, direction: "asc" } : sort.direction === "asc" ? { id, direction: "desc" } : null),
    page, setPage: value => updatePage(Math.max(1, Math.min(value, totalPages))), pageSize,
    setPageSize: value => { if ([10, 25, 50, 100].includes(value)) { updatePageSize(value); updatePage(1); } },
    filteredRows: remote ? rows : filteredRows, pageRows: remote ? rows : filteredRows.slice(offset, offset + pageSize), total, originalTotal: remote ? total : rows.length, totalPages, from: total ? offset + 1 : 0, to: Math.min(offset + pageSize, total),
    hasFilters: Boolean(query.trim() || Object.values(filterValues).some(Boolean)),
    clearFilters: () => { updateQuery(""); updateFilters({}); updatePage(1); },
  };
}
