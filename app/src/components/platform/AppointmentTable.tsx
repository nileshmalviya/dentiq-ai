import { Download, Eye } from "lucide-react";
import type { Appointment } from "../../data/appointments";
import { DataTable } from "../common/table/DataTable";
import { useTableData } from "../common/table/useTableData";
import { dateValue, filterOptions, timeValue } from "../common/table/formatters";
import type { TableColumn, TableFilter } from "../common/table/types";
import { StatusBadge } from "./PlatformUI";
import { exportCsv } from "./utils";

export function AppointmentTable({ rows, onSelect, admin = false, compact = false }: { rows: Appointment[]; onSelect?: (row: Appointment) => void; admin?: boolean; compact?: boolean }) {
  const columns: TableColumn<Appointment>[] = [
    { id: "time", label: "Time", value: row => timeValue(row.time), render: row => row.time, className: "nowrap" },
    { id: "patient", label: "Patient Name", value: row => row.patient, render: row => <strong>{row.patient}</strong> },
    { id: "purpose", label: "Purpose", value: row => row.purpose }, { id: "status", label: "Status", value: row => row.status, render: row => <StatusBadge status={row.status} /> },
  ];
  if (admin) columns.splice(2, 0, { id: "doctor", label: "Doctor", value: row => row.doctor });
  if (!compact) columns.unshift({ id: "id", label: "Appointment ID", value: row => row.id }, { id: "date", label: "Date", value: row => dateValue(row.date), render: row => row.date });
  if (onSelect) columns.push({ id: "actions", label: "Details", sortable: false, className: "sticky-actions", render: row => <button className="p-icon-button" type="button" aria-label={`View appointment for ${row.patient}`} onClick={() => onSelect(row)}><Eye size={17} /></button> });
  const filters: TableFilter<Appointment>[] = [
    { id: "status", label: "Appointment status", options: filterOptions(rows.map(row => row.status), "All statuses"), matches: (row, value) => row.status === value },
    { id: "date", label: "Appointment date", options: filterOptions(rows.map(row => row.date), "All dates"), matches: (row, value) => row.date === value },
  ];
  if (admin) filters.push({ id: "doctor", label: "Doctor", options: filterOptions(rows.map(row => row.doctor), "All doctors"), matches: (row, value) => row.doctor === value });
  const table = useTableData(rows, { columns, filters, searchText: row => `${row.id} ${row.patient} ${row.doctor} ${row.purpose} ${row.date} ${row.time} ${row.status}` });
  return <DataTable table={table} rowKey={row => row.id} label="appointments" compact={compact} actions={!compact && <button className="p-button p-button-outline" type="button" onClick={() => exportCsv("sample-appointments.csv", ["ID", "Date", "Time", "Patient", "Doctor", "Purpose", "Status"], table.filteredRows.map(row => [row.id, row.date, row.time, row.patient, row.doctor, row.purpose, row.status]))}><Download size={16} />Export</button>} />;
}
