import { geoPointSchema } from './location.validation.js';
import {personalSchema,professionalSchema,clinicSchema} from './doctorRegistration.validation.js';
import { z } from 'zod';
const text = z.string().trim().min(1).max(200), optional = z.string().trim().max(4000).default('');
const num = z.number().finite().min(0), reference = text;
export const definitions = {
    users: z.object({ name: text, email: z.string().email().toLowerCase(), passwordHash: text, emailVerified:z.boolean().optional(),accountStatus:z.enum(['ACTIVE','PENDING','REJECTED','SUSPENDED']).optional(), role: z.enum(['SUPER_ADMIN', 'DOCTOR', 'PATIENT']), status: z.enum(['Active', 'Inactive']).default('Active'), doctorId: reference.optional(), patientId: reference.optional(), clinicId: reference.optional(), phone: optional, clinic: optional, savedDoctorIds: z.array(reference).max(100).default([]), preferences: z.object({ appointments: z.boolean(), followups: z.boolean(), reports: z.boolean() }).default({ appointments: true, followups: true, reports: false }) }),
    doctors: z.object({ registrationId:reference.optional(),city:optional,registrationDate:optional,verificationOption:optional,registrationManaged:z.boolean().optional(),emailVerificationStatus:z.enum(['UNVERIFIED','VERIFIED']).optional(),approvalStatus:z.enum(['DRAFT','PENDING','APPROVED','REJECTED','SUSPENDED']).optional(),registrationNumber:optional,registrationCouncil:optional,registrationState:optional,doctorCategory:optional,subSpecialization:optional,qualifications:z.array(text).default([]),clinicIds:z.array(reference).default([]),approvedBy:reference.optional(),approvedAt:z.coerce.date().optional(),rejectedBy:reference.optional(),rejectedAt:z.coerce.date().optional(),rejectionReason:optional,clinicalServicesEnabled:z.boolean().optional(),slotDuration:z.number().int().min(30).max(60).optional(), userId: reference.optional(), name: text, email: z.string().email().toLowerCase(), phone: optional, specialty: text, qualification: text, experience: num.max(80), fee: num, rating: num.max(5).default(0), reviews: num.default(0), clinicId: reference, clinic: text, photo: optional, languages: optional, about: optional, treatments: z.array(text).max(50).default([]), distance: optional, nextAvailable: optional, status: z.enum(['Active', 'Inactive', 'Under Review']).default('Active'), availability: z.array(z.object({ day: z.number().int().min(1).max(7), times: z.array(z.string().regex(/^([01]\d|2[0-3]):(?:00|30)$/)).max(48) })).max(7).default([]), doctorReviews: z.array(z.object({ name: text, rating: num.max(5), date: text, text: optional })).default([]) }),
    patients: z.object({ userId: reference.optional(), name: text, email: z.string().email().toLowerCase(), phone: optional, age: num.max(130).optional(), gender: optional, medicalHistory: optional, doctorIds: z.array(reference).default([]), lastVisit: optional, treatment: optional, status: text.default('Active') }),
    clinics: z.object({ name: text, city: text, address: optional, state: optional, postalCode: optional, location: geoPointSchema.optional(), timezone: z.string().refine(value => {
            try {
                new Intl.DateTimeFormat('en', { timeZone: value });
                return true;
            }
            catch {
                return false;
            }
        }, 'Invalid timezone').default('Asia/Kolkata'), doctors: num.default(0), patients: num.default(0), status: text.default('Active') }),
    appointments: z.object({ patientId: reference, doctorId: reference, clinicId: reference, patient: text, doctor: text, appointmentDate: z.coerce.date(), startTime: text, endTime: text, date: text, time: text, consultationType: text.default('In Person'), status: z.enum(['Scheduled', 'Confirmed', 'Checked In', 'In Progress', 'Completed', 'Cancelled']).default('Scheduled'), purpose: text, reason: optional, notes: optional, fee: num }),
    inventory: z.object({ doctorId: reference, clinicId: reference, name: text, category: text, sku: text.optional(), quantity: num.int(), unit: text, minimumStock: num.int(), unitPrice: num, expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null), supplier: optional, notes: optional }),
    services: z.object({ name: text, category: text, price: num, icon: optional, status: z.enum(['Active', 'Inactive']).default('Active') }),
    'clinical-notes': z.object({ patientId: reference, doctorId: reference, patient: text, date: text, title: text, content: z.string().trim().min(1).max(10000), followUpAt: z.coerce.date().optional() }),
    consultations: z.object({ patientId: reference, doctorId: reference, patient: text, concern: text, symptoms: optional, time: text, status: z.enum(['Pending', 'Reviewed']).default('Pending') }),
    'treatment-plans': z.object({ patientId: reference, doctorId: reference, patient: text, title: text, completed: num.int(), total: num.int().min(1), steps: z.array(text).min(1).max(100), status: z.enum(['In Progress', 'Completed']).default('In Progress') }),
    billing: z.object({ patientId: reference, doctorId: reference, patient: text, treatment: text, date: text, amount: num, status: z.enum(['Pending', 'Paid']).default('Pending') }),
    records: z.object({ patientId: reference, doctorId: reference, doctor: text, title: text, date: text, type: text, description: optional }),
    payments: z.object({ invoiceId: reference, patientId: reference, doctorId: reference, amount: num, reference: text }),
    'inventory-transactions': z.object({ inventoryId: reference, clinicId: reference, doctorId: reference, actorId: reference, delta: z.number().int(), quantity: num.int(), reason: optional }),
    conversations: z.object({ ownerKey: text }),
    messages: z.object({ conversationId: reference, sender: z.enum(['user', 'assistant']), text: z.string().max(10000) }),
    recommendations: z.object({ ownerKey: text, concern: optional, doctorIds: z.array(reference) }),
    'doctor-registrations':z.object({userId:reference,doctorId:reference,clinicId:reference,personal:personalSchema,professional:professionalSchema,clinic:clinicSchema,registrationStep:z.number().int().default(5),requestStatus:z.enum(['DRAFT','PENDING','APPROVED','REJECTED','SUSPENDED']).default('DRAFT'),selectedVerificationOption:optional,submittedAt:z.coerce.date().optional(),lastReviewedAt:z.coerce.date().optional(),rejectionReason:optional,version:z.number().int().default(0),notificationStatus:optional}),
    'email-verifications':z.object({userId:reference,challengeId:reference,otpHash:optional,expiresAt:z.coerce.date(),nextSendAt:z.coerce.date(),attemptCount:z.number().int().min(0).default(0),consumed:z.boolean().default(false),deliveryStatus:z.enum(['PENDING','SENT','FAILED']).default('PENDING'),verifiedAt:z.coerce.date().optional()}),
    'doctor-approval-audits':z.object({doctorId:reference,registrationId:reference,action:text,performedBy:reference,reason:optional}),
    documents:z.object({ownerId:reference,doctorId:reference,registrationId:reference,documentType:text,secureStorageKey:text,originalName:text,mimeType:text,size:z.number().int().min(1),sha256:text,verificationStatus:text.default('PENDING'),active:z.boolean().default(true)}),
    'doctor-clinics':z.object({doctorId:reference,clinicId:reference,isPrimary:z.boolean().default(false),status:z.enum(['PENDING','ACTIVE']).default('PENDING')}),
    sessions: z.object({ userId: reference, tokenHash: text, expiresAt: z.coerce.date(), remember: z.boolean() })
};
export type Resource = keyof typeof definitions;
export const publicDoctorFields = ['id', 'name', 'specialty', 'qualification', 'experience', 'fee', 'rating', 'reviews', 'clinicId', 'clinic', 'photo', 'languages', 'about', 'treatments', 'distance', 'nextAvailable', 'doctorReviews'];
export function publicDoctor(row: Record<string, unknown>): Record<string, any> & { id: string } { return { ...Object.fromEntries(publicDoctorFields.map(key => [key, row[key]])), id: String(row.id) }; }

