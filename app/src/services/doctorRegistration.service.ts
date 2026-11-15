import { write } from './apiClient';
import { createResourceService } from './resource.service';
export type FieldValue = string | number | boolean | string[];
export type Section = Record<string, FieldValue>;
export interface DoctorApplication {
  personal: Section;
  professional: Section;
  clinic: Section;
}
export interface RegistrationField {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
  max?: number;
}
export interface RegistrationCatalog {
  fields: Record<keyof DoctorApplication, RegistrationField[]>;
  categories: {
    name: string;
    specialties: string[];
    qualifications: string[];
    dentalBookingEnabled: boolean;
  }[];
  verificationOptions: string[];
  documentTypes: string[];
  uploadLimitBytes: number;
  slotDurations: number[];
}
export interface RegistrationDocument {
  id: string;
  documentType: string;
  originalName: string;
  mimeType: string;
  size: number;
  verificationStatus: string;
  uploadedAt?: string;
}
export interface RegistrationDetails {
  application: DoctorApplication & {
    id: string;
    requestStatus: string;
    selectedVerificationOption?: string;
    rejectionReason?: string;
    notificationStatus?: string;
    createdAt?: string;
  };
  doctor: Record<string, unknown>;
  emailVerified: boolean;
  documents: RegistrationDocument[];
  missingDocuments: string[];
  audit: {
    id: string;
    action: string;
    performedBy: string;
    reason?: string;
    createdAt: string;
  }[];
  otp: {
    nextSendAt: string;
    expiresAt: string;
    attemptCount: number;
    deliveryStatus: string;
  } | null;
  message?: string;
}
export const doctorRegistrationService = {
  ...createResourceService(['/doctor-registration']),
  register: (
    data: DoctorApplication & { password: string; confirmPassword: string },
  ) =>
    write<{
      registrationId: string;
      message: string;
      emailDeliveryStatus: string;
    }>('/doctor-registration', 'POST', data),
  correct: (data: Partial<DoctorApplication>) =>
    write<RegistrationDetails>('/doctor-registration/me', 'PATCH', data),
  submit: (option: string) =>
    write<RegistrationDetails>(
      '/doctor-registration/verification-request',
      'POST',
      { option },
    ),
};
