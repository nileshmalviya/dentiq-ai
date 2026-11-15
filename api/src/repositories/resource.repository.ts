import mongoose from 'mongoose';
import type { UnitOfWork } from '../interfaces/repositories/repository.js';
import type { Criteria, Row } from '../types/index.js';
import { models } from '../models/resource.model.js';
import type { Resource } from '../validations/resource.validation.js';
import { clean } from './mongo.repository.js';
export { MongoRepository } from './mongo.repository.js';
export class MongoUnitOfWork implements UnitOfWork {
    constructor(private stock: Pick<UnitOfWork, 'adjustStock'>, private appointments: Pick<UnitOfWork, 'book' | 'transition'>) { }
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
    book: UnitOfWork['book'] = (...args) => this.appointments.book(...args);
    transition: UnitOfWork['transition'] = (...args) => this.appointments.transition(...args);
    adjustStock: UnitOfWork['adjustStock'] = (...args) => this.stock.adjustStock(...args);
}
export async function ensureIndexes() { for (const model of Object.values(models))
    await model.createIndexes(); }
