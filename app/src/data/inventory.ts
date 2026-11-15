export interface InventoryItem {
  id: string; doctorId: string; clinicId: string; name: string; category: string; quantity: number;
  unit: string; minimumStock: number; unitPrice: number; expiryDate: string | null; supplier: string; notes: string;
}
const owner = { doctorId: "arjun-mehta", clinicId: "CL-001", supplier: "Dental Supply Co.", notes: "Static demonstration inventory." };
export const mockInventory: InventoryItem[] = [
  { ...owner, id: "INV-001", name: "Dental Gloves", category: "Protective Equipment", quantity: 18, unit: "boxes", minimumStock: 20, unitPrice: 420, expiryDate: "2027-08-31" },
  { ...owner, id: "INV-002", name: "Face Masks", category: "Protective Equipment", quantity: 60, unit: "boxes", minimumStock: 20, unitPrice: 180, expiryDate: "2027-12-31" },
  { ...owner, id: "INV-003", name: "Syringes", category: "Consumables", quantity: 150, unit: "pieces", minimumStock: 50, unitPrice: 12.5, expiryDate: "2027-06-30" },
  { ...owner, id: "INV-004", name: "Local Anesthesia", category: "Medicines", quantity: 8, unit: "boxes", minimumStock: 10, unitPrice: 950, expiryDate: "2026-11-22" },
  { ...owner, id: "INV-005", name: "Dental Filling Material", category: "Restorative", quantity: 0, unit: "kits", minimumStock: 5, unitPrice: 1250, expiryDate: "2026-11-08" },
  { ...owner, id: "INV-006", name: "Composite Resin", category: "Restorative", quantity: 42, unit: "syringes", minimumStock: 10, unitPrice: 850, expiryDate: "2027-06-30" },
  { ...owner, id: "INV-007", name: "Root Canal Files", category: "Endodontics", quantity: 5, unit: "packs", minimumStock: 10, unitPrice: 640, expiryDate: "2026-11-28" },
  { ...owner, id: "INV-008", name: "Dental Cement", category: "Restorative", quantity: 12, unit: "kits", minimumStock: 6, unitPrice: 720, expiryDate: "2026-12-05" },
  { ...owner, id: "INV-009", name: "Cotton Rolls", category: "Consumables", quantity: 0, unit: "packs", minimumStock: 10, unitPrice: 110, expiryDate: null },
  { ...owner, id: "INV-010", name: "Disinfectant", category: "Sterilization", quantity: 6, unit: "bottles", minimumStock: 8, unitPrice: 380, expiryDate: "2026-12-30" },
  { ...owner, id: "INV-011", name: "Impression Material", category: "Impressions", quantity: 18, unit: "kits", minimumStock: 5, unitPrice: 560, expiryDate: "2027-01-31" },
  { ...owner, id: "INV-012", name: "Sterilization Pouches", category: "Sterilization", quantity: 35, unit: "packs", minimumStock: 10, unitPrice: 290, expiryDate: null },
  { ...owner, id: "INV-013", name: "Saliva Ejectors", category: "Consumables", quantity: 90, unit: "pieces", minimumStock: 30, unitPrice: 4.5, expiryDate: null },
  { ...owner, id: "INV-014", name: "Dental Bibs", category: "Protective Equipment", quantity: 24, unit: "packs", minimumStock: 12, unitPrice: 160, expiryDate: null },
  { ...owner, id: "INV-201", doctorId: "neha-sharma", clinicId: "CL-002", name: "Endodontic Files", category: "Endodontics", quantity: 40, unit: "packs", minimumStock: 10, unitPrice: 700, expiryDate: "2027-05-31" },
];
export const inventoryCategories = ["Protective Equipment", "Consumables", "Medicines", "Restorative", "Endodontics", "Sterilization", "Impressions"];
export const inventoryUnits = ["boxes", "pieces", "packs", "kits", "syringes", "bottles", "tubes", "cartridges"];
