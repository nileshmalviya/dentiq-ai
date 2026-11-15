export type Role = 'SUPER_ADMIN' | 'DOCTOR' | 'PATIENT';
export interface Actor {
    id: string;
    role: Role;
    doctorId?: string;
    patientId?: string;
    clinicId?: string;
}
export type Row = Record<string, any> & {
    id: string;
};
export type Criteria = Record<string, unknown>;
export interface ListSpec {
    filter: Criteria;
    sort: Record<string, 1 | -1>;
    skip: number;
    limit: number;
}
