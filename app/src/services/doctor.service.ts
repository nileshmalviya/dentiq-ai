import { createResourceService } from './resource.service';
import { api, write } from './apiClient';
import type { Doctor } from '../data/doctors';
export interface NearbyDoctor extends Doctor { doctorId: string; clinicId: string; clinicName: string; clinicAddress: string; distanceKm?: number; }
export interface ClinicLocation { id: string; name: string; address: string; city: string; state: string; postalCode: string; location?: { type: 'Point'; coordinates: [number, number] }; }
export interface ConfirmedClinicLocation { latitude: number; longitude: number; confirmed: boolean; }
export interface NearbyDoctorParams { latitude?: number; longitude?: number; city?: string; radiusKm: number; page: number; limit: number; specialization?: string; search?: string; concern?: string; sort?: 'distance' | 'rating' | 'experience'; }
export const doctorService = {
  ...createResourceService(['/admin/doctors', '/public/doctors']),
  getNearbyDoctors(params: NearbyDoctorParams, signal?: AbortSignal) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== '') query.set(key, String(value));
    return api<NearbyDoctor[]>(`/public/doctors/nearby?${query}`, { signal, cache: 'no-store', referrerPolicy: 'no-referrer' });
  },
  getClinicLocations: () => api<ClinicLocation[]>('/doctor/clinic-locations'),
  updateClinicLocation: (id: string, data: ConfirmedClinicLocation & Pick<ClinicLocation, 'address' | 'city' | 'state' | 'postalCode'>) => write<ClinicLocation>(`/doctor/clinic-locations/${encodeURIComponent(id)}`, 'PATCH', data),
};
