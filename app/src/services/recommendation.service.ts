import { createResourceService } from './resource.service';
import { write } from './apiClient';
export const recommendationService = { ...createResourceService(['/recommendations']), getDoctors<T>(data: unknown) { return write<T>('/recommendations/doctors', 'POST', data); } };
