import { AppError } from '../errors/AppError.js';
import type { Criteria, ListSpec } from '../types/index.js';
export const escapeSearch = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function prepareQuery(query: Record<string, unknown>, fields: string[], scope: Criteria = {}, aliases: Record<string, string> = {}, searchableFields?: string[]): ListSpec & {
    page: number;
} {
    for (const [key, value] of Object.entries(query))
        if (typeof value !== 'string' || /[$.\[\]]/.test(key))
            throw new AppError(400, 'Invalid query parameter');
    const page = Number(query.page ?? 1), limit = Number(query.limit ?? 10);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || ![10, 25, 50, 100].includes(limit))
        throw new AppError(400, 'Invalid page or limit');
    const sortBy = aliases[String(query.sortBy)] || String(query.sortBy || 'createdAt');
    if (![...fields, 'createdAt', 'id'].includes(sortBy))
        throw new AppError(400, 'Unsupported sort field');
    if (query.sortOrder && !['asc', 'desc'].includes(String(query.sortOrder)))
        throw new AppError(400, 'Invalid sort order');
    const filters: Criteria[] = [scope];
    if (query.search) {
        if (String(query.search).length > 200)
            throw new AppError(400, 'Search is too long');
        const numericFields = ['reviews', 'quantity', 'unitPrice', 'minimumStock', 'fee', 'experience', 'rating', 'amount', 'price', 'completed', 'total', 'age', 'appointments', 'revenue', 'percent', 'doctors', 'patients'];
        const textMatches = (searchableFields || fields).filter(field => !numericFields.includes(field) && !['appointmentDate', 'expiresAt', 'followUpAt'].includes(field)).map(field => ({ [field]: { $regex: escapeSearch(String(query.search)), $options: 'i' } }));
        const numericMatches = fields.filter(field => numericFields.includes(field)).map(field => ({ $expr: { $regexMatch: { input: { $convert: { input: '$'.concat(field), to: 'string', onError: '', onNull: '' } }, regex: escapeSearch(String(query.search)), options: 'i' } } }));
        filters.push({ $or: [...textMatches, ...numericMatches] });
    }
    const common: Record<string, string> = { status: 'status', category: 'category', specialty: 'specialty', specialization: 'specialty', patient: 'patient', doctor: 'doctor', date: 'date', type: 'type', concern: 'concern', month: 'month', clinicId: 'clinicId', doctorId: 'doctorId', patientId: 'patientId', inventoryId: 'inventoryId' };
    for (const [key, field] of Object.entries({ ...common, ...aliases }))
        if (query[key] && !['sortBy', 'sortOrder'].includes(key))
            filters.push({ [field]: query[key] });
    return { page, limit, skip: (page - 1) * limit, filter: { $and: filters }, sort: { [sortBy]: query.sortOrder === 'desc' ? -1 : 1, ...(sortBy !== 'id' ? { id: 1 as const } : {}) } };
}
export function pagination(page: number, limit: number, totalRecords: number) { return { page, limit, totalRecords, totalPages: Math.ceil(totalRecords / limit), hasNextPage: page * limit < totalRecords, hasPreviousPage: page > 1 }; }
