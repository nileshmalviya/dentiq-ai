import { ok, wrap } from '../middleware/index.js';
import type { InventoryContract } from '../interfaces/services/contracts.js';
import { ResourceController } from './resource.controller.js';
export class InventoryController extends ResourceController {
    constructor(private inventory: InventoryContract) { super(inventory); }
    filteredList = (filter: '' | '/low-stock' | '/expiring-soon') => wrap(async (req, res) => { const result = await this.inventory.listByView(req.actor!, req.query, filter); return ok(res, result.data, 200, result.pagination); });
    adjust = (direction: 'in' | 'out') => wrap(async (req, res) => ok(res, await this.inventory.adjust(req.actor!, String(req.params.id), req.body.amount, direction, req.body.reason)));
}
