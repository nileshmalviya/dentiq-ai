import { createResourceService } from './resource.service';
import { write } from './apiClient';
export const patientService = { ...createResourceService(['/admin/patients', '/doctor/patients', '/patient/profile', '/patient/records', '/patient/favorites']),
    updateProfile<T>(data: unknown) { return write<T>('/patient/profile', 'PATCH', data); },
    saveDoctor<T>(id: string | undefined, saved: boolean) { return write<T>(`/patient/favorites/${id}`, saved ? 'PUT' : 'DELETE'); }
};
