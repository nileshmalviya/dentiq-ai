import type { ReactNode } from "react";
export type SortValue = string | number | null | undefined;
export interface TableColumn<T> { id: string; label: string; value?: (row: T) => SortValue; render?: (row: T) => ReactNode; sortable?: boolean; className?: string; }
export interface TableFilter<T> { id: string; label: string; type?: "select" | "date"; options?: { value: string; label: string }[]; matches: (row: T, value: string) => boolean; }
export interface TableSort { id: string; direction: "asc" | "desc"; }
export interface TableController<T> {
  loading?: boolean; error?: string;
  columns: TableColumn<T>[]; filterDefinitions: TableFilter<T>[];
  query: string; setQuery: (value: string) => void; filterValues: Record<string, string>; setFilter: (id: string, value: string) => void;
  sort: TableSort | null; setSort: (sort: TableSort | null) => void; toggleSort: (id: string) => void;
  page: number; setPage: (page: number) => void; pageSize: number; setPageSize: (size: number) => void;
  filteredRows: T[]; pageRows: T[]; total: number; originalTotal: number; totalPages: number; from: number; to: number; hasFilters: boolean; clearFilters: () => void;
}
