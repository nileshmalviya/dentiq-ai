import mongoose from 'mongoose';
import type { Repository } from '../interfaces/repositories/repository.js';
import type { Criteria, ListSpec, Row } from '../types/index.js';
import { models } from '../models/resource.model.js';
import type { Resource } from '../validations/resource.validation.js';
export const clean = (doc: any): Row => { const value = doc.toObject ? doc.toObject() : doc; const { _id, __v, ...row } = value; return row as Row; };
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
