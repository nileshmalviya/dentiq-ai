import type { Actor, Criteria, ListSpec, Row } from '../../types/index.js';
export interface Repository {
    create(data: Record<string, unknown>): Promise<Row>;
    findOne(filter: Criteria): Promise<Row | null>;
    findMany(spec: ListSpec): Promise<Row[]>;
    countDocuments(filter: Criteria): Promise<number>;
    update(filter: Criteria, data: Record<string, unknown>): Promise<Row | null>;
    delete(filter: Criteria): Promise<Row | null>;
    aggregate(pipeline: Record<string, unknown>[]): Promise<any[]>;
}
export interface UnitOfWork {
    register(user: Row, patient: Row): Promise<Row>;
    book(appointment: Row, patient: Row | undefined, patientId: string): Promise<Row>;
    transition(id: string, from: string, status: string, scope: Criteria): Promise<Row | null>;
    adjustStock(id: string, scope: Criteria, delta: number, actor: Actor, reason: string): Promise<Row | null>;
    profile(operations: {
        resource: string;
        filter: Criteria;
        data: Record<string, unknown>;
    }[], returnIndex: number): Promise<Row>;
    provisionDoctor(doctor: Row, user: Row): Promise<Row>;
}
