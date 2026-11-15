import mongoose from 'mongoose';
import type { Repository, UnitOfWork } from '../../common/interfaces/repository.js';
import type { Criteria, ListSpec, Row, Actor } from '../../common/types/index.js';
import { models } from './resource.model.js';
import type { Resource } from './resource.validation.js';
import { randomUUID } from 'node:crypto';
const clean = (doc: any): Row => { const value = doc.toObject ? doc.toObject() : doc; const { _id, __v, ...row } = value; return row as Row; };
export class MongoRepository implements Repository {
    constructor(readonly resource: Resource) { }
    async create(data: Record<string, unknown>) { return clean(await models[this.resource].create(data)); }
    async findOne(filter: Criteria) { const row = await models[this.resource].findOne(filter).lean(); return row ? clean(row) : null; }
    async findMany(spec: ListSpec) { return (await models[this.resource].find(spec.filter).sort(spec.sort).skip(spec.skip).limit(spec.limit).lean()).map(clean); }
    async countDocuments(filter: Criteria) { return models[this.resource].countDocuments(filter); }
    async update(filter: Criteria, data: Record<string, unknown>) { const row = await models[this.resource].findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true }).lean(); return row ? clean(row) : null; }
    async delete(filter: Criteria) { const row = await models[this.resource].findOneAndDelete(filter).lean(); return row ? clean(row) : null; }
    async aggregate(pipeline: Record<string, unknown>[]) { return models[this.resource].aggregate(pipeline as unknown as mongoose.PipelineStage[]); }
    async seed(id: string, data: Record<string, unknown>) { return models[this.resource].updateOne({ id }, { $setOnInsert: data }, { upsert: true, runValidators: true }); }
}
export class MongoUnitOfWork implements UnitOfWork {
    async register(user: Row, patient: Row) { return mongoose.connection.transaction(async (session) => { await models.patients.create([patient], { session }); return clean((await models.users.create([user], { session }))[0]); }); }
    async profile(operations: {
        resource: string;
        filter: Criteria;
        data: Record<string, unknown>;
    }[], returnIndex: number) {
        return mongoose.connection.transaction(async (session) => {
            const results: Row[] = [];
            for (const operation of operations) {
                const row = await models[operation.resource as Resource].findOneAndUpdate(operation.filter, { $set: operation.data }, { new: true, runValidators: true, session }).lean();
                if (!row)
                    throw new Error('Profile unavailable');
                results.push(clean(row));
            }
            return results[returnIndex];
        });
    }
    async provisionDoctor(doctor: Row, user: Row) { return mongoose.connection.transaction(async (session) => { await models.users.create([user], { session }); return clean((await models.doctors.create([doctor], { session }))[0]); }); }
    async book(appointment: Row, patient: Row | undefined, patientId: string) { return mongoose.connection.transaction(async (session) => { if (patient)
        await models.patients.create([patient], { session }); await models.patients.updateOne({ id: patientId }, { $addToSet: { doctorIds: appointment.doctorId } }, { session }); return clean((await models.appointments.create([appointment], { session }))[0]); }); }
    async transition(id: string, from: string, status: string, scope: Criteria) { const row = await models.appointments.findOneAndUpdate({ $and: [scope, { id, status: from }] }, { $set: { status } }, { new: true, runValidators: true }).lean(); return row ? clean(row) : null; }
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
export const repositories = Object.fromEntries(Object.keys(models).map(name => [name, new MongoRepository(name as Resource)])) as Record<Resource, MongoRepository>;
export async function ensureIndexes() { for (const model of Object.values(models))
    await model.createIndexes(); }
