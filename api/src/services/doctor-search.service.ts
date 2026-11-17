import { AppError } from '../errors/AppError.js';
import type { ClinicSearchStore } from '../repositories/clinic-search.repository.js';
import { doctorSearchQuerySchema } from '../validations/location.validation.js';
import { escapeSearch, pagination } from '../utils/query.js';
import type { Criteria } from '../types/index.js';
import type { Repositories } from '../interfaces/repositories/registry.js';
import { presentDoctors } from './doctor-directory.service.js';
import { guidance } from './recommendation.service.js';
import { normalizePatientConcern } from './patient-language.js';
import { approvedDoctorCondition } from './clinic-location.service.js';

export class DoctorSearchService {
  constructor(private store: ClinicSearchStore, private repos: Repositories, private maximumRadiusKm = 100) {}
  async search(raw: Record<string, unknown>) {
    // Validate again at the service boundary, including callers other than HTTP.
    const parsed = doctorSearchQuerySchema.safeParse(raw);
    if (!parsed.success) throw new AppError(400, 'Invalid doctor search parameters');
    const query = parsed.data;
    if (raw.radiusKm === undefined) query.radiusKm = Math.min(query.radiusKm, this.maximumRadiusKm);
    if (query.latitude !== undefined && query.radiusKm > this.maximumRadiusKm) throw new AppError(400, 'Search radius exceeds the allowed maximum');
    const conditions: Criteria[] = [];
    if (query.specialization) conditions.push({ specialty: { $regex: escapeSearch(query.specialization), $options: 'i' } });
    if (query.search) conditions.push({ $or: ['name', 'specialty'].map(field => ({ [field]: { $regex: escapeSearch(query.search), $options: 'i' } })) });
    if (query.concern) {
      const result = guidance(query.concern);
      if (result.emergency) return { data: [], pagination: pagination(query.page, query.limit, 0) };
      const treatment = /implant|extraction|whitening|aligner|braces|cleaning|filling|root canal|crown/i.exec(normalizePatientConcern(query.concern))?.[0];
      conditions.push(treatment ? { treatments: { $regex: treatment, $options: 'i' } } : { $or: result.specializations.map(s => ({ specialty: { $regex: s, $options: 'i' } })) });
    }
    const doctorFilter: Criteria = { status: 'Active',
      clinicalServicesEnabled: { $ne: false }, $and: [approvedDoctorCondition(), ...conditions],
    };
    const result = await this.store.search({ ...query, doctorFilter });
    const doctors = await presentDoctors(this.repos, result.doctors.map(row => ({ ...row.doctor, clinicId: row.clinicId, clinic: row.clinicName })));
    return { data: result.doctors.map((row, index) => ({ ...doctors[index], doctorId: doctors[index].id,
      specialization: doctors[index].specialty, clinicId: row.clinicId, clinicName: row.clinicName, clinicAddress: row.clinicAddress || '',
      clinicCity: row.clinicCity || '', clinicState: row.clinicState || '', clinicPostalCode: row.clinicPostalCode || '',
      ...(typeof row.distanceMeters === 'number' ? { distanceKm: Math.round(row.distanceMeters / 10) / 100 } : {}),
    })), pagination: pagination(query.page, query.limit, result.total) };
  }
}
