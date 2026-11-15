import { AppError } from '../errors/AppError.js';
import type { Actor } from '../types/index.js';
import { ResourceService } from './resource.service.js';
export class InventoryService extends ResourceService {
    async listByView(actor: Actor, query: Record<string, unknown>, view: '' | '/low-stock' | '/expiring-soon') { return this.list(actor, { ...query, ...(view === '/low-stock' ? { stock: 'Low Stock' } : view ? { expiry: 'Expiring Soon' } : {}) }); }
    async adjust(actor: Actor, id: string, amount: number, direction: 'in' | 'out', reason: string) {
        if (!Number.isSafeInteger(amount) || amount <= 0)
            throw new AppError(422, 'Stock amount must be a positive integer');
        await this.get(actor, id);
        const row = await this.work.adjustStock(id, this.scope(actor), direction === 'in' ? amount : -amount, actor, reason);
        if (!row)
            throw new AppError(409, 'Insufficient stock or item changed');
        return row;
    }
    async summary(actor: Actor) { const today = new Date().toISOString().slice(0, 10), soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10); const [row] = await this.repos.inventory.aggregate([{ $match: this.scope(actor) }, { $group: { _id: null, total: { $sum: 1 }, value: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }, low: { $sum: { $cond: [{ $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$quantity', '$minimumStock'] }] }, 1, 0] } }, out: { $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] } }, soon: { $sum: { $cond: [{ $and: [{ $gte: ['$expiryDate', today] }, { $lte: ['$expiryDate', soon] }] }, 1, 0] } }, expired: { $sum: { $cond: [{ $and: [{ $ne: ['$expiryDate', null] }, { $lt: ['$expiryDate', today] }] }, 1, 0] } } } }]); return row || { total: 0, value: 0, low: 0, out: 0, soon: 0, expired: 0 }; }
}
