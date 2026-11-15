import { createResourceService } from './resource.service';
import { write } from './apiClient';
export const userService = { ...createResourceService(['/admin/settings', '/doctor/settings']), updateSettings<T>(endpoint: string, data: unknown) { return write<T>(endpoint, 'PATCH', data); } };
