import type { Actor, Row, Criteria } from '../types/index.js';
import type { Repositories } from '../interfaces/repositories/registry.js';
import { AppError } from '../errors/AppError.js';
import { confirmedClinicLocationSchema, updateClinicLocationSchema } from '../validations/location.validation.js';

export function confirmedClinicPoint(value: unknown) {
  const location = confirmedClinicLocationSchema.parse(value);
  return { type: 'Point' as const, coordinates: [location.longitude, location.latitude] };
}
// The existing admin directory treats active legacy (non-onboarding) doctors as approved.
// Explicit rejected/pending statuses never qualify, even on an imported record.
export function approvedDoctorCondition(): Criteria {
  return { $or: [
    { registrationManaged: { $ne: true }, approvalStatus: { $exists: false } },
    { approvalStatus: 'APPROVED', $or: [{ registrationManaged: { $ne: true } }, { emailVerificationStatus: 'VERIFIED' }] },
  ] };
}
// Used by profiles and booking to check clinic associations without duplicating coordinates.
export async function doctorHasClinic(repos: Repositories, doctor: Row, clinicId: string) {
  return doctor.clinicId === clinicId || (doctor.clinicIds || []).includes(clinicId) || Boolean(await repos['doctor-clinics'].findOne({ doctorId: doctor.id, clinicId, status: 'ACTIVE' }));
}
export class ClinicLocationService {
  constructor(private repos: Repositories) {}
  private async doctor(actor: Actor) {
    if (actor.role !== 'DOCTOR' || !actor.doctorId) throw new AppError(403, 'Doctor access required');
    const doctor = await this.repos.doctors.findOne({ id: actor.doctorId, status: 'Active', $and: [approvedDoctorCondition(), { $or: [{ userId: actor.id }, { userId: { $exists: false } }] }] });
    if (!doctor) throw new AppError(403, 'An approved doctor account is required to update clinic locations');
    return doctor;
  }
  async list(actor: Actor) {
    const doctor = await this.doctor(actor);
    const links = await this.repos['doctor-clinics'].findMany({ filter: { doctorId: doctor.id, status: 'ACTIVE' }, sort: { clinicId: 1 }, skip: 0, limit: 100 });
    const ids = [...new Set([doctor.clinicId, ...(doctor.clinicIds || []), ...links.map(link => link.clinicId)])];
    const clinics = await this.repos.clinics.findMany({ filter: { id: { $in: ids }, status: 'Active' }, sort: { name: 1, id: 1 }, skip: 0, limit: 100 });
    return clinics.map(clinic => ({ id: clinic.id, name: clinic.name, address: clinic.address || '', city: clinic.city, state: clinic.state || '', postalCode: clinic.postalCode || '', location: clinic.location }));
  }
  async update(actor: Actor, clinicId: string, input: unknown) {
    const doctor = await this.doctor(actor), data = updateClinicLocationSchema.parse(input);
    if (!await doctorHasClinic(this.repos, doctor, clinicId)) throw new AppError(403, 'You cannot update this clinic');
    const clinic = await this.repos.clinics.update({ id: clinicId, status: 'Active' }, {
      address: data.address, city: data.city, state: data.state, postalCode: data.postalCode,
      location: confirmedClinicPoint({ latitude: data.latitude, longitude: data.longitude, confirmed: data.confirmed }),
    });
    if (!clinic) throw new AppError(404, 'Clinic not available');
    return { id: clinic.id, name: clinic.name, address: clinic.address, city: clinic.city, state: clinic.state, postalCode: clinic.postalCode, location: clinic.location };
  }
}
