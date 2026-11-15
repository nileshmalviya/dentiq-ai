import type { InventoryItem } from "../../data/inventory";
import { dateValue } from "../../components/common/table/formatters";
export function stockStatus(item: InventoryItem) { return item.quantity === 0 ? "Out of Stock" : item.quantity <= item.minimumStock ? "Low Stock" : "In Stock"; }
export function inventoryValue(item: InventoryItem) { return item.quantity * Math.round(item.unitPrice * 100) / 100; }
export function currentClinicDay() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${parts.find(part => part.type === "year")!.value}-${parts.find(part => part.type === "month")!.value}-${parts.find(part => part.type === "day")!.value}`;
}
export function expiryStatus(item: InventoryItem, today = currentClinicDay()) {
  const expiry = dateValue(item.expiryDate); if (expiry == null) return "No expiry";
  const days = Math.round((expiry - dateValue(today)!) / 86400000);
  return days < 0 ? "Expired" : days <= 30 ? "Expiring Soon" : "Valid";
}
export const inventoryMoney = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
export function expiryLabel(value: string | null) { const date = dateValue(value); return date == null ? "Not applicable" : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date); }
