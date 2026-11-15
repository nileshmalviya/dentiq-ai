import { useResourceRows, useResource } from "../../api/hooks";
import { write, invalidate, reportError } from "../../api/client";
import { useState } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Eye, Package, Pencil, Plus, Trash2 } from "lucide-react";


import type { InventoryItem } from "../../data/inventory";
import { LocalNotice, Modal, PageHeading, Panel } from "../../components/platform/PlatformUI";
import { DataTable } from "../../components/common/table/DataTable";
import { useTableData } from "../../components/common/table/useTableData";
import { dateValue, filterOptions } from "../../components/common/table/formatters";
import { DetailList } from "../../components/common/DetailList";
import { InventoryItemForm, StockAdjustmentForm } from "../../modules/inventory/InventoryForms";
import type { InventoryInput } from "../../modules/inventory/InventoryForms";
import { currentClinicDay, expiryLabel, expiryStatus, inventoryMoney, inventoryValue, stockStatus } from "../../modules/inventory/inventoryUtils";

type InventoryDialog = { mode: "add" | "edit" | "view" | "delete" | "in" | "out"; id?: string } | null;
function StockBadge({ item }: { item: InventoryItem }) { const status = stockStatus(item); return <span className={`status-badge ${status === "Out of Stock" ? "badge-red" : status === "Low Stock" ? "badge-amber" : "badge-green"}`}>{status}</span>; }

export default function Inventory() {
  const [items] = useResourceRows<InventoryItem>("/inventory");
  const {data:summary} = useResource<{total:number;value:number;low:number;out:number;soon:number;expired:number}>("/inventory/summary",{total:0,value:0,low:0,out:0,soon:0,expired:0});
  const [dialog, setDialog] = useState<InventoryDialog>(null); const [notice, setNotice] = useState("");
  const selected = items.find(item => item.id === dialog?.id), today = currentClinicDay();
  const [transactions]=useResourceRows<{id:string;delta:number;quantity:number;reason:string;createdAt:string}>(selected && dialog?.mode === "view"?`/inventory/transactions?inventoryId=${selected.id}`:null);
  const history=useTableData(transactions,{columns:[{id:"createdAt",label:"Date",value:row=>row.createdAt,render:row=>new Date(row.createdAt).toLocaleString()},{id:"delta",label:"Movement",value:row=>row.delta},{id:"quantity",label:"Balance",value:row=>row.quantity},{id:"reason",label:"Reason",value:row=>row.reason}],searchText:row=>row.reason});
  const table = useTableData(items, {
    searchText: item => `${item.id} ${item.name} ${item.category} ${item.quantity} ${item.unit} ${item.minimumStock} ${item.unitPrice} ${inventoryMoney(item.unitPrice)} ${inventoryValue(item)} ${inventoryMoney(inventoryValue(item))} ${item.expiryDate || ""} ${expiryLabel(item.expiryDate)} ${expiryStatus(item, today)} ${stockStatus(item)} ${item.supplier}`,
    filters: [
      { id: "category", label: "Inventory category", options: filterOptions(items.map(item => item.category), "All categories"), matches: (item, value) => item.category === value },
      { id: "stock", label: "Stock status", options: filterOptions(["In Stock", "Low Stock", "Out of Stock"], "All stock statuses"), matches: (item, value) => stockStatus(item) === value },
      { id: "expiry", label: "Expiry status", options: filterOptions(["Expired", "Expiring Soon", "Valid", "No expiry"], "All expiry statuses"), matches: (item, value) => expiryStatus(item, today) === value },
      { id: "expiryBefore", label: "Expires on or before", type: "date", matches: (item, value) => item.expiryDate != null && dateValue(item.expiryDate)! <= dateValue(value)! },
    ],
    columns: [
      { id: "id", label: "Item ID", value: item => item.id }, { id: "name", label: "Item Name", value: item => item.name, render: item => <strong>{item.name}</strong> },
      { id: "category", label: "Category", value: item => item.category }, { id: "quantity", label: "Quantity", value: item => item.quantity },
      { id: "unit", label: "Unit", value: item => item.unit }, { id: "minimum", label: "Minimum Stock Level", value: item => item.minimumStock },
      { id: "price", label: "Unit Price (₹)", value: item => item.unitPrice, render: item => inventoryMoney(item.unitPrice) },
      { id: "value", label: "Total Value (₹)", value: inventoryValue, render: item => inventoryMoney(inventoryValue(item)) },
      { id: "expiry", label: "Expiry Date", value: item => dateValue(item.expiryDate), render: item => <div className="inventory-expiry"><span>{expiryLabel(item.expiryDate)}</span>{["Expired", "Expiring Soon"].includes(expiryStatus(item, today)) && <small className={expiryStatus(item, today) === "Expired" ? "expiry-expired" : "expiry-soon"}>{expiryStatus(item, today)}</small>}</div> },
      { id: "stock", label: "Stock Status", value: stockStatus, render: item => <StockBadge item={item} /> },
      { id: "actions", label: "Actions", sortable: false, className: "sticky-actions", render: item => <div className="inventory-row-actions"><button className="p-icon-button" type="button" aria-label={`View or adjust ${item.name}`} title="View details and adjust stock" onClick={() => setDialog({ mode: "view", id: item.id })}><Eye size={17} /></button><button className="p-icon-button" type="button" aria-label={`Edit ${item.name}`} title="Edit item" onClick={() => setDialog({ mode: "edit", id: item.id })}><Pencil size={16} /></button><button className="p-icon-button danger-action" type="button" aria-label={`Delete ${item.name}`} title="Delete item" onClick={() => setDialog({ mode: "delete", id: item.id })}><Trash2 size={16} /></button></div> },
    ],
  });
  const {low,out,soon,expired}=summary;
  async function save(value:InventoryInput){try{const {quantity,...details}=value;await write(selected && dialog?.mode === "edit"?`/inventory/${selected.id}`:"/inventory",selected && dialog?.mode === "edit"?"PATCH":"POST",selected && dialog?.mode === "edit"?details:{...details,quantity});invalidate();setNotice("Inventory saved.");setDialog(null);}catch(error){reportError(error);}}
  const summaries = [{ label: "Total Inventory Items", value: String(summary.total), tone: "green" }, { label: "Low Stock Items", value: String(low), tone: "amber" }, { label: "Out of Stock Items", value: String(out), tone: "red" }, { label: "Expiring Soon Items", value: String(soon), tone: "amber" }, { label: "Total Inventory Value", value: inventoryMoney(summary.value), tone: "green" }];
  return <><PageHeading title="Inventory Management" description="Track supplies, stock levels and expiry dates for your clinic."><button type="button" className="p-button" onClick={() => setDialog({ mode: "add" })}><Plus size={17} />Add Inventory Item</button></PageHeading><div className="inventory-summary">{summaries.map(summary => <div className="stat-card" key={summary.label}><span className={`stat-icon tone-${summary.tone}`}><Package size={22} /></span><div><strong>{summary.value}</strong><span>{summary.label}</span></div></div>)}</div><LocalNotice message={notice} />{(low > 0 || out > 0 || soon > 0 || expired > 0) && <section className="inventory-alerts" aria-label="Inventory alerts"><AlertTriangle size={19} /><div>{low > 0 && <button type="button" onClick={() => table.setFilter("stock", "Low Stock")}>{low} low stock</button>}{out > 0 && <button type="button" onClick={() => table.setFilter("stock", "Out of Stock")}>{out} out of stock</button>}{soon > 0 && <button type="button" onClick={() => table.setFilter("expiry", "Expiring Soon")}>{soon} expiring within 30 days</button>}{expired > 0 && <button type="button" className="expiry-expired" onClick={() => table.setFilter("expiry", "Expired")}>{expired} expired</button>}</div></section>}<Panel><DataTable table={table} rowKey={item => item.id} label="inventory" className="inventory-table" /></Panel><p className="demo-note inventory-session-note">Changes are saved to your clinic inventory. Open an item’s details to use Stock In or Stock Out.</p>
    <Modal key={`${dialog?.mode}-${dialog?.id || "new"}`} title={dialog?.mode === "add" ? "Add Inventory Item" : dialog?.mode === "edit" ? "Edit Inventory Item" : dialog?.mode === "delete" ? "Delete Inventory Item" : dialog?.mode === "in" ? "Stock In" : dialog?.mode === "out" ? "Stock Out" : "Inventory Item Details"} open={Boolean(dialog)} onClose={() => setDialog(null)}>
      {(dialog?.mode === "add" || dialog?.mode === "edit") && <InventoryItemForm item={dialog.mode === "edit" ? selected : undefined} onSave={save} onCancel={() => setDialog(null)} />}
      {selected && dialog?.mode === "view" && <><h3 className="inventory-item-heading">{selected.name}</h3><StockBadge item={selected} /><DetailList rows={[["Item ID", selected.id], ["Category", selected.category], ["Quantity", `${selected.quantity} ${selected.unit}`], ["Minimum stock", String(selected.minimumStock)], ["Unit price", inventoryMoney(selected.unitPrice)], ["Total value", inventoryMoney(inventoryValue(selected))], ["Expiry date", expiryLabel(selected.expiryDate)], ["Expiry status", expiryStatus(selected, today)], ["Supplier", selected.supplier || "Not specified"]]} />{selected.notes && <p className="demo-note">{selected.notes}</p>}<h3>Stock movement history</h3><DataTable table={history} rowKey={row=>row.id} label="stock movements" compact /><div className="inventory-dialog-actions"><button type="button" className="p-button" onClick={() => setDialog({ mode: "in", id: selected.id })}><ArrowDownToLine size={17} />Stock In</button><button type="button" className="p-button p-button-outline" disabled={selected.quantity === 0} onClick={() => setDialog({ mode: "out", id: selected.id })}><ArrowUpFromLine size={17} />Stock Out</button><button type="button" className="p-button p-button-outline" onClick={() => setDialog({ mode: "edit", id: selected.id })}>Edit item</button><button type="button" className="p-button danger-button" onClick={() => setDialog({ mode: "delete", id: selected.id })}>Delete item</button></div></>}
      {selected && (dialog?.mode === "in" || dialog?.mode === "out") && <StockAdjustmentForm item={selected} direction={dialog.mode} onCancel={() => setDialog(null)} onSave={quantity => {const amount=Math.abs(quantity-selected.quantity);void write(`/inventory/${selected.id}/stock-${dialog.mode === "in"?"in":"out"}`,"POST",{amount,reason:"Clinic stock adjustment"}).then(()=>{invalidate();setNotice("Stock adjustment saved.");setDialog(null);}).catch(reportError);}} />}
      {selected && dialog?.mode === "delete" && <><p>Delete <strong>{selected.name}</strong> ({selected.id}) from your demo inventory?</p><p className="demo-note">Stock movements remain in the transaction history.</p><div className="inventory-dialog-actions"><button className="p-button p-button-outline" type="button" onClick={() => setDialog(null)}>Cancel</button><button className="p-button danger-button" type="button" onClick={() => {void write(`/inventory/${selected.id}`,"DELETE").then(()=>{invalidate();setNotice("Item deleted.");setDialog(null);}).catch(reportError);}}>Delete item</button></div></>}
    </Modal></>;
}
