import mongoose from 'mongoose';
import type { Criteria, Actor } from '../types/index.js';
import { models } from '../models/resource.model.js';
import { randomUUID } from 'node:crypto';
import { MongoRepository, clean } from './mongo.repository.js';
export class InventoryRepository extends MongoRepository {
    constructor() { super('inventory'); }
    async adjustStock(id: string, scope: Criteria, delta: number, actor: Actor, reason: string) {
        return mongoose.connection.transaction(async (session) => {
            const row: any = await models.inventory.findOneAndUpdate({ $and: [scope, { id }, ...(delta < 0 ? [{ quantity: { $gte: -delta } }] : [])] }, { $inc: { quantity: delta } }, { new: true, runValidators: true, session }).lean();
            if (!row)
                return null;
            await models['inventory-transactions'].create([{ id: randomUUID(), inventoryId: id, clinicId: row.clinicId, doctorId: row.doctorId, actorId: actor.id, delta, quantity: row.quantity, reason }], { session });
            return clean(row);
        });
    }
}
