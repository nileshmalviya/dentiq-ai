import { doctorHasClinic } from './clinic-location.service.js';
import { presentDoctors } from './doctor-directory.service.js';
import { AppError } from '../errors/AppError.js';
import { pagination, prepareQuery } from '../utils/query.js';
import type { Repositories } from './resource.service.js';
export class PublicService {
    constructor(private repos: Repositories) { }
    async list(name: 'doctors' | 'services', query: Record<string, unknown>) { const fields = name === 'doctors' ? ['id', 'name', 'specialty', 'clinic', 'rating', 'experience', 'fee'] : ['id', 'name', 'category', 'price']; const spec = prepareQuery(query, fields, { status: 'Active',...(name==='doctors'?{clinicalServicesEnabled:{$ne:false},$or:[{registrationManaged:{$ne:true}},{approvalStatus:'APPROVED',emailVerificationStatus:'VERIFIED'}]}:{}) }); const [rows, total] = await Promise.all([this.repos[name].findMany(spec), this.repos[name].countDocuments(spec.filter)]); return { filters: {}, data: name === 'doctors' ? await presentDoctors(this.repos, rows) : rows, pagination: pagination(spec.page, spec.limit, total) }; }
    async doctor(id: string, clinicId?: string) {
        const doctor = await this.repos.doctors.findOne({ id, status: 'Active',clinicalServicesEnabled:{$ne:false},$or:[{registrationManaged:{$ne:true}},{approvalStatus:'APPROVED',emailVerificationStatus:'VERIFIED'}] });
        if (!doctor)
            throw new AppError(404, 'Doctor not found');
        if (clinicId) {
            if (!await doctorHasClinic(this.repos, doctor, clinicId)) throw new AppError(404, 'Clinic not available');
            const clinic = await this.repos.clinics.findOne({ id: clinicId, status: 'Active' });
            if (!clinic) throw new AppError(404, 'Clinic not available');
            return { ...(await presentDoctors(this.repos, [{ ...doctor, clinicId, clinic: clinic.name }]))[0], clinicAddress: clinic.address || '', distance: '' };
        }
        return (await presentDoctors(this.repos, [doctor]))[0];
    }
}
