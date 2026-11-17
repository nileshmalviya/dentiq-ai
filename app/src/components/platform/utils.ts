export const money = (amount: number, locale = "en-IN") => new Intl.NumberFormat(locale, { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
export function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const content = [headers, ...rows].map(row => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
