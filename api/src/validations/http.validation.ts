import { z } from 'zod';
import { definitions, type Resource } from './resource.validation.js';
export const httpSchemas = { register: (z.object({ name: z.string().trim().min(2).max(120), email: z.string().email().toLowerCase(), password: z.string().min(12).max(72), phone: z.string().trim().min(7).max(30) }).strict()),
    login: (z.object({ email: z.string().email().toLowerCase(), password: z.string().min(1).max(72), remember: z.boolean().default(false) }).strict()),
    forgotPassword: (z.object({ email: z.string().email() })),
    settings: (definitions.users.pick({ name: true, email: true, phone: true, clinic: true, preferences: true }).partial().strict()),
    appointmentStatus: (z.object({ status: definitions.appointments.shape.status }).strict()),
    updateResource: (name: Resource) => (definitions[name].partial().strict()),
    createInventory: (definitions.inventory.omit({ doctorId: true, clinicId: true }).extend({ doctorId: z.string().optional(), clinicId: z.string().optional() }).strict()),
    updateInventory: (definitions.inventory.partial().strict()),
    stockMovement: (z.object({ amount: z.number().int().positive(), reason: z.string().max(1000).default('') }).strict()),
    patientProfile: (definitions.patients.pick({ name: true, email: true, phone: true, age: true, gender: true }).partial().strict()),
    bookAppointment: (z.object({ doctorId: z.string().min(1), date: z.string(), startTime: z.string().datetime(), reason: z.string().trim().min(1).max(1000), patient: z.object({ name: z.string().trim().min(2).max(120), email: z.string().email(), phone: z.string().regex(/^[+\d ()-]{7,30}$/) }).optional() }).strict()),
    recommendation: (z.object({ concern: z.string().max(4000), search: z.string().max(200).default('') })),
    chatMessage: (z.object({ message: z.string().trim().min(1).max(4000), conversationId: z.string().uuid().optional() })), createResource: (name: Resource) => (name === 'doctors' ? definitions.doctors.extend({ password: z.string().min(12).max(72) }) : definitions[name]).partial().strict() };
