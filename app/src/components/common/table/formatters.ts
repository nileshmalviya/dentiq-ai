const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
export function dateValue(value: string | null | undefined): number | null {
  if (!value) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) { const result = Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])); return new Date(result).toISOString().slice(0, 10) === value ? result : null; }
  const sample = /^(\d{1,2})\s+([a-z]{3})(?:\s+(\d{4}))?$/i.exec(value.trim());
  if (sample) { const month = months.indexOf(sample[2].toLowerCase()); return month < 0 ? null : Date.UTC(Number(sample[3] || 2026), month, Number(sample[1])); }
  if (value === "This session") { const today = new Date(); return Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()); }
  return null;
}
export function timeValue(value: string): number { const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value); return match ? (Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(match[2]) : 0; }
export function relativeMinutes(value: string): number { const match = /^(\d+)\s*(min|hour|day)/i.exec(value); return match ? Number(match[1]) * (match[2] === "day" ? 1440 : match[2] === "hour" ? 60 : 1) : 0; }
export function filterOptions(values: string[], allLabel: string) { return [{ value: "", label: allLabel }, ...[...new Set(values)].sort((a, b) => a.localeCompare(b)).map(value => ({ value, label: value }))]; }
