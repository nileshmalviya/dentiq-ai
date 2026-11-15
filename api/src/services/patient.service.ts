import { AppError } from '../errors/AppError.js';
import type { Actor } from '../types/index.js';
import { ResourceService } from './resource.service.js';
export class PatientService extends ResourceService {
    async favorites(actor: Actor) {
        if (actor.role !== 'PATIENT')
            throw new AppError(403, 'Access denied');
        const user = await this.repos.users.findOne({ id: actor.id });
        return user?.savedDoctorIds || [];
    }
    async saveDoctor(actor: Actor, doctorId: string, saved: boolean) {
        if (!await this.repos.doctors.findOne({ id: doctorId, status: 'Active' }))
            throw new AppError(404, 'Doctor not found');
        const previous: string[] = await this.favorites(actor);
        const next = saved ? [...new Set([...previous, doctorId])] : previous.filter(id => id !== doctorId);
        await this.repos.users.update({ id: actor.id }, { savedDoctorIds: next });
        return next;
    }
}
