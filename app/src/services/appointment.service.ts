import { createResourceService } from './resource.service';
import { write } from './apiClient';
export const appointmentService = { ...createResourceService(['/admin/appointments', '/doctor/appointments', '/patient/appointments']), book<T>(data: unknown) { return write<T>('/public/appointments', 'POST', data); } };
