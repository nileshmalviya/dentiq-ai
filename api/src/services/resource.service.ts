import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { DateTime } from 'luxon';
import { AppError } from '../errors/AppError.js';
import type { UnitOfWork } from '../interfaces/repositories/repository.js';
import type { Actor, Criteria, Row } from '../types/index.js';
import { pagination, prepareQuery } from '../utils/query.js';
import { definitions, type Resource } from '../validations/resource.validation.js';
import type { Repositories } from '../interfaces/repositories/registry.js';
export type { Repositories } from '../interfaces/repositories/registry.js';
export class ResourceService {
    constructor(readonly resource: Resource, protected repos: Repositories, protected work: UnitOfWork) { }
    scope(actor: Actor): Criteria {
        if (actor.role === 'SUPER_ADMIN')
            return {};
        if (actor.role === 'DOCTOR' && actor.doctorId) {
            if (this.resource === 'patients')
                return { doctorIds: actor.doctorId };
            if (['doctors', 'clinics', 'users'].includes(this.resource))
                return { id: this.resource === 'doctors' ? actor.doctorId : this.resource === 'clinics' ? actor.clinicId : actor.id };
            return { doctorId: actor.doctorId, ...(this.resource === 'inventory' || this.resource === 'inventory-transactions' ? { clinicId: actor.clinicId } : {}) };
        }
        if (actor.role === 'PATIENT' && actor.patientId && ['patients', 'appointments', 'records', 'clinical-notes', 'treatment-plans', 'billing'].includes(this.resource))
            return this.resource === 'patients' ? { id: actor.patientId } : { patientId: actor.patientId };
        throw new AppError(403, 'Access denied');
    }
    async facets(actor: Actor) {
        const selected = Object.keys(definitions[this.resource].shape).filter(key => ['status', 'category', 'specialty', 'patient', 'doctor', 'date', 'type', 'concern', 'city', 'treatment'].includes(key));
        if (!selected.length)
            return {} as Record<string, string[]>;
        const pipelines = Object.fromEntries(selected.map(key => [key, [{ $match: { [key]: { $nin: [null, ''] } } }, { $group: { _id: '$'.concat(key) } }, { $sort: { _id: 1 } }, { $limit: 100 }]]));
        const [result] = await this.repos[this.resource].aggregate([{ $match: this.scope(actor) }, { $facet: pipelines }]);
        const facets = Object.fromEntries(selected.map(key => [key, (result?.[key] || []).map((row: any) => String(row._id))]));
        if (this.resource === 'patients')
            facets.detail = facets.treatment;
        if (this.resource === 'clinics')
            facets.detail = facets.city;
        return facets;
    }
    async list(actor: Actor, query: Record<string, unknown>) {
        const fields = Object.keys(definitions[this.resource].shape).filter(key => !['passwordHash', 'medicalHistory', 'preferences', 'availability', 'doctorReviews', 'steps', 'doctorIds', 'treatments'].includes(key));
        if (this.resource === 'inventory')
            fields.push('value', 'stock');
        if (this.resource === 'treatment-plans')
            fields.push('progress');
        const aliases: Record<string, string> = this.resource === 'doctors' ? { 'detail-0': 'clinic', 'detail-1': 'experience', 'detail-2': 'rating' } : this.resource === 'patients' ? { 'detail-0': 'phone', 'detail-1': 'treatment', 'detail-2': 'lastVisit', detail: 'treatment' } : this.resource === 'clinics' ? { 'detail-0': 'city', 'detail-1': 'doctors', 'detail-2': 'patients', detail: 'city' } : this.resource === 'inventory' ? { minimum: 'minimumStock', price: 'unitPrice', expiry: 'expiryDate' } : this.resource === 'consultations' ? { received: 'createdAt' } : {};
        // Stock and expiry are expressions, not persisted UI labels.
        const safeQuery = { ...query };
        if (this.resource === 'inventory') {
            delete safeQuery.stock;
            delete safeQuery.expiry;
            delete safeQuery.expiryBefore;
        }
        const searchable = Object.entries(definitions[this.resource].shape).filter(([, type]) => {
            let field: any = type;
            while (field._def.innerType || field._def.schema)
                field = field._def.innerType || field._def.schema;
            return ['ZodString', 'ZodEnum'].includes(field._def.typeName);
        }).map(([key]) => key);
        if (this.resource === 'clinical-notes')
            delete safeQuery.followUpDue;
        const spec = prepareQuery(safeQuery, fields, this.scope(actor), aliases, ['id', ...searchable]);
        if (this.resource === 'clinical-notes' && query.followUpDue === 'true')
            (spec.filter.$and as Criteria[]).push({ followUpAt: { $lte: new Date() } });
        if (this.resource === 'inventory') {
            const filters = (spec.filter.$and as Criteria[]);
            const today = DateTime.now().setZone('Asia/Kolkata').toISODate()!, soon = DateTime.now().setZone('Asia/Kolkata').plus({ days: 30 }).toISODate()!;
            if (query.stock === 'Out of Stock')
                filters.push({ quantity: 0 });
            if (query.stock === 'Low Stock')
                filters.push({ quantity: { $gt: 0 }, $expr: { $lte: ['$quantity', '$minimumStock'] } });
            if (query.stock === 'In Stock')
                filters.push({ $expr: { $gt: ['$quantity', '$minimumStock'] } });
            if (query.expiry === 'Expired')
                filters.push({ expiryDate: { $lt: today, $ne: null } });
            if (query.expiry === 'Expiring Soon')
                filters.push({ expiryDate: { $gte: today, $lte: soon } });
            if (query.expiry === 'Valid')
                filters.push({ expiryDate: { $gt: soon } });
            if (query.expiry === 'No expiry')
                filters.push({ expiryDate: null });
            if (query.expiryBefore)
                filters.push({ expiryDate: { $lte: query.expiryBefore, $ne: null } });
        }
        if (this.resource === 'clinics' || (this.resource === 'inventory' && ['value', 'stock'].includes(String(query.sortBy))) || (this.resource === 'treatment-plans' && query.sortBy === 'progress')) {
            const derived: Record<string, unknown>[] = [];
            if (this.resource === 'clinics')
                derived.push({ $lookup: { from: 'doctors', localField: 'id', foreignField: 'clinicId', as: '_doctors' } }, { $lookup: { from: 'appointments', let: { clinic: '$id' }, pipeline: [{ $match: { $expr: { $eq: ['$clinicId', '$$clinic'] } } }, { $group: { _id: '$patientId' } }], as: '_patients' } }, { $addFields: { doctors: { $size: '$_doctors' }, patients: { $size: '$_patients' } } }, { $project: { _doctors: 0, _patients: 0 } });
            if (this.resource === 'inventory')
                derived.push({ $addFields: { value: { $multiply: ['$quantity', '$unitPrice'] }, stock: { $switch: { branches: [{ case: { $eq: ['$quantity', 0] }, then: 'Out of Stock' }, { case: { $lte: ['$quantity', '$minimumStock'] }, then: 'Low Stock' }], default: 'In Stock' } } } });
            if (this.resource === 'treatment-plans')
                derived.push({ $addFields: { progress: { $cond: [{ $gt: ['$total', 0] }, { $divide: ['$completed', '$total'] }, 0] } } });
            const [result] = await this.repos[this.resource].aggregate([{ $match: spec.filter }, ...derived, { $facet: { data: [{ $sort: spec.sort }, { $skip: spec.skip }, { $limit: spec.limit }, { $project: { _id: 0 } }], count: [{ $count: 'total' }] } }]);
            return { filters: await this.facets(actor), data: result.data, pagination: pagination(spec.page, spec.limit, result.count[0]?.total || 0) };
        }
        const [rows, total] = await Promise.all([this.repos[this.resource].findMany(spec), this.repos[this.resource].countDocuments(spec.filter)]);
        return { filters: await this.facets(actor), data: rows.map(row => this.sanitize(row)), pagination: pagination(spec.page, spec.limit, total) };
    }
    sanitize(row: Row): Row { const { passwordHash, tokenHash, ...safe } = row; return safe as Row; }
    async summary(actor: Actor) {
        const [result] = await this.repos[this.resource].aggregate([{ $match: this.scope(actor) }, { $group: { _id: null, total: { $sum: 1 }, pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } }, reviewed: { $sum: { $cond: [{ $eq: ['$status', 'Reviewed'] }, 1, 0] } }, checkedIn: { $sum: { $cond: [{ $eq: ['$status', 'Checked In'] }, 1, 0] } }, inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } }, scheduled: { $sum: { $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0] } }, amount: { $sum: '$amount' }, paid: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0] } } } }]);
        return result || { total: 0, pending: 0, reviewed: 0, checkedIn: 0, inProgress: 0, scheduled: 0, amount: 0, paid: 0 };
    }
    async get(actor: Actor, id: string) {
        const row = await this.repos[this.resource].findOne({ $and: [this.scope(actor), { id }] });
        if (!row)
            throw new AppError(404, 'Record not found');
        return this.sanitize(row);
    }
    async validateBusiness(actor: Actor, data: Record<string, any>, existing?: Row) {
        if (data.patientId) {
            const patient = await this.repos.patients.findOne({ id: data.patientId, ...(actor.role === 'DOCTOR' ? { doctorIds: actor.doctorId } : {}) });
            if (!patient)
                throw new AppError(403, 'Patient is outside your care scope');
            data.patient = patient.name;
        }
        if (actor.role === 'DOCTOR') {
            data.doctorId = actor.doctorId;
            if (this.resource === 'inventory')
                data.clinicId = actor.clinicId;
        }
        if (this.resource === 'inventory' && existing && data.quantity !== undefined && data.quantity !== existing.quantity)
            throw new AppError(422, 'Use stock-in or stock-out to change quantity');
        if (this.resource === 'treatment-plans') {
            const merged = { ...existing, ...data };
            if (merged.completed > merged.total || merged.total !== merged.steps.length)
                throw new AppError(422, 'Invalid treatment plan progress');
            data.status = merged.completed === merged.total ? 'Completed' : 'In Progress';
        }
        if (data.clinicId && !await this.repos.clinics.findOne({ id: data.clinicId }))
            throw new AppError(422, 'Clinic does not exist');
        if (data.doctorId && !await this.repos.doctors.findOne({ id: data.doctorId }))
            throw new AppError(422, 'Doctor does not exist');
    }
    async create(actor: Actor, input: Record<string, any>) {
        if (actor.role === 'PATIENT')
            throw new AppError(403, 'Access denied');
        const data = { ...input };
        if (actor.role === 'DOCTOR') {
            data.doctorId = actor.doctorId;
            if (this.resource === 'inventory')
                data.clinicId = actor.clinicId;
        }
        if (this.resource === 'clinical-notes')
            data.date = new Date().toISOString().slice(0, 10);
        await this.validateBusiness(actor, data);
        if (this.resource === 'doctors') {
            if (actor.role !== 'SUPER_ADMIN')
                throw new AppError(403, 'Access denied');
            const password = data.password;
            if (typeof password !== 'string' || password.length < 12)
                throw new AppError(422, 'Provide a doctor password with at least 12 characters');
            delete data.password;
            const doctor = definitions.doctors.parse(data), id = randomUUID(), userId = randomUUID();
            return this.work.provisionDoctor({ ...doctor, id, userId }, { id: userId, name: doctor.name, email: doctor.email, passwordHash: await bcrypt.hash(password, 12), role: 'DOCTOR', status: 'Active', doctorId: id, clinicId: doctor.clinicId });
        }
        return this.repos[this.resource].create({ id: randomUUID(), ...definitions[this.resource].parse(data) });
    }
    async saveProfile(actor: Actor, resource: string, data: Record<string, unknown>) {
        const accountFields = Object.fromEntries(Object.entries(data).filter(([key]) => ['name', 'email', 'phone', 'clinic', 'preferences'].includes(key)));
        if (actor.role === 'PATIENT')
            return this.work.profile([{ resource: 'users', filter: { id: actor.id }, data: accountFields }, { resource: 'patients', filter: { id: actor.patientId, userId: actor.id }, data }], 1);
        if (actor.role === 'DOCTOR') {
            const doctorFields = resource === 'doctors' ? data : Object.fromEntries(Object.entries(data).filter(([key]) => ['name', 'email', 'phone'].includes(key)));
            return this.work.profile([{ resource: 'users', filter: { doctorId: actor.doctorId }, data: accountFields }, { resource: 'doctors', filter: { id: actor.doctorId }, data: doctorFields }], resource === 'doctors' ? 1 : 0);
        }
        return this.work.profile([{ resource: 'users', filter: { id: actor.id }, data: accountFields }], 0);
    }
    async update(actor: Actor, id: string, input: Record<string, any>) {
        const existing = await this.get(actor, id);
        if (this.resource === 'appointments')
            throw new AppError(422, 'Use appointment status endpoint');
        const allowed = actor.role === 'PATIENT' ? ['name', 'email', 'phone', 'age', 'gender'] : this.resource === 'users' ? ['name', 'email', 'phone', 'clinic', 'preferences'] : null;
        if (allowed && Object.keys(input).some(key => !allowed.includes(key)))
            throw new AppError(422, 'Unsupported profile field');
        if (Object.keys(input).some(key => ['id', 'userId', 'doctorId', 'clinicId', 'patientId', 'doctorIds', 'passwordHash', 'role'].includes(key)))
            throw new AppError(422, 'Ownership fields cannot be changed');
        const data = definitions[this.resource].partial().strict().parse(input);
        await this.validateBusiness(actor, data, existing);
        if ((this.resource === 'patients' && actor.role === 'PATIENT') || this.resource === 'users')
            return this.sanitize(await this.saveProfile(actor, this.resource, data));
        if (this.resource === 'doctors' && actor.role === 'SUPER_ADMIN')
            return this.saveProfile({ id: existing.userId || '', role: 'DOCTOR', doctorId: existing.id }, 'doctors', data);
        const row = await this.repos[this.resource].update({ $and: [this.scope(actor), { id }] }, data);
        if (!row)
            throw new AppError(409, 'Record changed');
        return this.sanitize(row);
    }
    async remove(actor: Actor, id: string) {
        await this.get(actor, id);
        if (actor.role !== 'SUPER_ADMIN' && this.resource !== 'inventory')
            throw new AppError(403, 'Access denied');
        if (['doctors', 'patients', 'clinics', 'services'].includes(this.resource))
            return this.repos[this.resource].update({ id }, { status: 'Inactive' });
        return this.repos[this.resource].delete({ $and: [this.scope(actor), { id }] });
    }
}
