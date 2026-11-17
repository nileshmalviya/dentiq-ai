import { confirmedClinicLocationSchema } from './location.validation.js';
import { z } from 'zod';
import {
  registrationFields,
  verificationOptions,
  documentTypes,
  type RegistrationField,
} from '../constants/doctorRegistration.js';
function fieldSchema(field: RegistrationField): z.ZodTypeAny {
  if (field.type === 'checkbox') return z.boolean().default(false);
  if (field.type === 'multi' || field.type === 'list') {
    let value = z.array(z.string().trim().min(1).max(200)).max(50);
    if (field.required) value = value.min(1);
    return value.default([]);
  }
  if (field.type === 'number')
    return z.preprocess(
      (v) => (v === '' ? NaN : v),
      z.coerce
        .number()
        .finite()
        .min(0)
        .max(field.max || 10000000),
    );
  if (field.type === 'select' && field.options?.length)
    return z
      .string()
      .trim()
      .refine(
        (v) => (!v && !field.required) || field.options!.includes(v),
        'Choose a valid ' + field.label.toLowerCase(),
      )
      .default('');
  let value = z
    .string()
    .trim()
    .max(field.type === 'textarea' ? 4000 : 250);
  if (field.required) value = value.min(1, `${field.label} is required`);
  if (field.type === 'email') value = value.email().toLowerCase();
  if (field.type === 'phone') {
    const phone = value.refine(
      (v) =>
        (!v && !field.required) ||
        (/^[+\d ()-]{7,30}$/.test(v) &&
          v.replace(/\D/g, '').length >= 7 &&
          v.replace(/\D/g, '').length <= 15),
      'Enter a valid phone number',
    );
    return field.required ? phone : phone.default('');
  }
  return field.required ? value : value.default('');
}
export const personalSchema = z
  .object(
    Object.fromEntries(
      registrationFields.personal.map((f) => [f.name, fieldSchema(f)]),
    ),
  )
  .strict();
export const professionalSchema = z
  .object(
    Object.fromEntries(
      registrationFields.professional.map((f) => [f.name, fieldSchema(f)]),
    ),
  )
  .strict();
export const clinicSchema = z
  .object(
    Object.fromEntries(
      registrationFields.clinic.map((f) => [f.name, fieldSchema(f)]),
    ),
  )
  .strict();
export const applicationSchema = z
  .object({
    personal: personalSchema,
    professional: professionalSchema,
    clinic: clinicSchema,
  })
  .strict();
export const registerDoctorSchema = applicationSchema
  .extend({
    clinicLocation: confirmedClinicLocationSchema.optional(),
    password: z
      .string()
      .min(12)
      .max(72)
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[0-9]/, 'Include a number')
      .regex(/[^A-Za-z0-9]/, 'Include a symbol'),
    confirmPassword: z.string().min(1),
  })
  .strict()
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  });
export const correctApplicationSchema = applicationSchema
  .omit({ personal: true })
  .partial()
  .extend({
    personal: personalSchema.omit({ email: true }).partial().optional(),
    clinicLocation: confirmedClinicLocationSchema.optional(),
  })
  .strict();
export const requestVerificationSchema = z
  .object({ option: z.enum(verificationOptions) })
  .strict();
export const verifyOtpSchema = z
  .object({ otp: z.string().regex(/^\d{6}$/, 'Enter the six-digit code') })
  .strict();
export const uploadDocumentSchema = z
  .object({ documentType: z.enum(documentTypes) })
  .strict();
export const rejectDoctorSchema = z
  .object({ reason: z.string().trim().min(10).max(2000) })
  .strict();
