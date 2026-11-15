import { write } from './apiClient';
export const emailVerificationService = {
  resend: () => write('/doctor-registration/resend-otp', 'POST'),
  verify: (otp: string) =>
    write('/doctor-registration/verify-otp', 'POST', { otp }),
};
