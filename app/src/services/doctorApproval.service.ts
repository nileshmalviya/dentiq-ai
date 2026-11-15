import { api, write } from './apiClient';
import { createResourceService } from './resource.service';
import type { RegistrationDetails } from './doctorRegistration.service';
export const doctorApprovalService = {
  ...createResourceService(['/admin/doctor-registrations']),
  details: (id: string) =>
    api<RegistrationDetails>(
      '/admin/doctor-registrations/' + encodeURIComponent(id),
    ),
  approve: (id: string) =>
    write<RegistrationDetails>(
      '/admin/doctor-registrations/' + encodeURIComponent(id) + '/approve',
      'POST',
    ),
  reject: (id: string, reason: string) =>
    write<RegistrationDetails>(
      '/admin/doctor-registrations/' + encodeURIComponent(id) + '/reject',
      'POST',
      { reason },
    ),
  retryNotification: (id: string) =>
    write<RegistrationDetails>(
      '/admin/doctor-registrations/' +
        encodeURIComponent(id) +
        '/retry-notification',
      'POST',
    ),
};
