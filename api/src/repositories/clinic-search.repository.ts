import type { Repository } from '../interfaces/repositories/repository.js';
import type { Criteria, Row } from '../types/index.js';
import type { DoctorSearchQuery } from '../validations/location.validation.js';
import { escapeSearch } from '../utils/query.js';

export interface ClinicSearchSpec extends DoctorSearchQuery { doctorFilter: Criteria; }
export interface ClinicSearchStore {
  search(spec: ClinicSearchSpec): Promise<{ doctors: Row[]; total: number }>;
}
// All filtering, doctor deduplication, sorting and pagination happen in MongoDB.
export function clinicSearchPipeline(spec: ClinicSearchSpec): Record<string, unknown>[] {
  const precise = spec.latitude !== undefined && spec.longitude !== undefined;
  const pipeline: Record<string, unknown>[] = [precise ? { $geoNear: {
    near: { type: 'Point', coordinates: [spec.longitude, spec.latitude] },
    key: 'location', distanceField: 'distanceMeters', spherical: true,
    maxDistance: spec.radiusKm * 1000, query: { status: 'Active' },
  } } : { $match: { status: 'Active', $or: ['city', 'address'].map(field => ({ [field]: { $regex: escapeSearch(spec.city), $options: 'i' } })) } }];
  pipeline.push(
    { $lookup: { from: 'doctor-clinics', localField: 'id', foreignField: 'clinicId', pipeline: [{ $match: { status: 'ACTIVE' } }, { $project: { _id: 0, doctorId: 1 } }], as: 'memberships' } },
    { $lookup: { from: 'doctors', let: { clinicId: '$id', memberIds: '$memberships.doctorId' }, pipeline: [
      { $match: { ...spec.doctorFilter, $expr: { $or: [
        { $eq: ['$clinicId', '$$clinicId'] },
        { $in: ['$$clinicId', { $ifNull: ['$clinicIds', []] }] },
        { $in: ['$id', '$$memberIds'] },
      ] } } },
      { $project: { _id: 0, id: 1, name: 1, specialty: 1, rating: 1, reviews: 1, experience: 1, fee: 1, photo: 1, clinicId: 1, qualification: 1, languages: 1, about: 1, treatments: 1, availability: 1, slotDuration: 1 } },
    ], as: 'doctor' } },
    { $unwind: '$doctor' },
    // Select the nearest clinic for each doctor before sorting/paging the doctors.
    { $sort: precise ? { distanceMeters: 1, 'doctor.id': 1, id: 1 } : { 'doctor.id': 1, id: 1 } },
    { $group: { _id: '$doctor.id', match: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$match' } },
    { $sort: spec.sort === 'rating' ? { 'doctor.rating': -1, ...(precise ? { distanceMeters: 1 } : {}), 'doctor.id': 1 }
      : spec.sort === 'experience' ? { 'doctor.experience': -1, ...(precise ? { distanceMeters: 1 } : {}), 'doctor.id': 1 }
        : precise ? { distanceMeters: 1, 'doctor.id': 1 } : { 'doctor.name': 1, 'doctor.id': 1 } },
    { $facet: { count: [{ $count: 'total' }], doctors: [
      { $skip: (spec.page - 1) * spec.limit }, { $limit: spec.limit },
      { $project: { _id: 0, doctor: 1, clinicId: '$id', clinicName: '$name', clinicAddress: '$address', clinicCity: '$city', clinicState: '$state', clinicPostalCode: '$postalCode', timezone: 1, distanceMeters: 1 } },
    ] } },
  );
  return pipeline;
}
export class ClinicSearchRepository implements ClinicSearchStore {
  constructor(private clinics: Pick<Repository, 'aggregate'>) {}
  async search(spec: ClinicSearchSpec) {
    const [result] = await this.clinics.aggregate(clinicSearchPipeline(spec));
    return { doctors: result?.doctors || [], total: result?.count?.[0]?.total || 0 };
  }
}
