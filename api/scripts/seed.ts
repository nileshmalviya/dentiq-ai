import dataset from './seed-data.json' with { type: 'json' };
import { DateTime } from 'luxon';
import bcrypt from 'bcryptjs';
import { resolve } from 'node:path';
import { readEnv } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { ensureIndexes, repositories } from '../src/modules/resources/resource.repository.js';
import { definitions, type Resource } from '../src/modules/resources/resource.validation.js';
export async function seedFixtures(passwords: {
    admin: string;
    doctor: string;
    patient: string;
}) {
    const { doctors, doctorReviews } = dataset.doctors;
    const { clinics } = dataset.dashboard;
    const { services } = dataset.services;
    const { mockPatients, mockDentalRecords } = dataset.mockPatients;
    const { mockAppointments } = dataset.mockAppointments;
    const { mockInventory } = dataset.inventory;
    const clinical = dataset.mockClinicalData;
    const { mockUsers } = dataset.mockUsers;
    const put = async (name: Resource, row: any) => { const { id, ...input } = row; const data = definitions[name].parse(input); await repositories[name].seed(id, { id, ...data }); };
    for (const row of clinics)
        await put('clinics', { ...row, doctors: 0, patients: 0, timezone: 'Asia/Kolkata' });
    for (const [index, row] of doctors.entries())
        await put('doctors', { ...row, userId: index === 0 ? 'demo-doctor' : `user-${row.id}`, email: index === 0 ? 'doctor@dentiq.com' : `${row.id}@dentiq.com`, clinicId: `CL-00${index + 1}`, status: 'Active', doctorReviews, availability: Array.from({ length: 7 }, (_, i) => ({ day: i + 1, times: ['10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '16:30', '17:00'] })) });
    for (const row of mockPatients)
        await put('patients', { ...row, ...(row.id === 'PT-1001' ? { userId: 'demo-patient' } : {}) });
    for (const row of mockUsers) {
        const role = { "super-admin": "SUPER_ADMIN", doctor: 'DOCTOR', patient: 'PATIENT' }[row.role as string];
        const password = row.role === 'super-admin' ? passwords.admin : row.role === 'doctor' ? passwords.doctor : passwords.patient;
        await put('users', { ...row, passwordHash: await bcrypt.hash(password, 12), role, status: 'Active', ...(row.role === 'doctor' ? { clinicId: 'CL-001' } : {}) });
    }
    // Give every seeded doctor an account, preserving the original main doctor's login.
    for (const row of doctors.slice(1))
        await put('users', { id: `user-${row.id}`, name: row.name, email: `${row.id}@dentiq.com`, role: 'DOCTOR', doctorId: row.id, clinicId: row.id === 'neha-sharma' ? 'CL-002' : 'CL-003', passwordHash: await bcrypt.hash(passwords.doctor, 12), status: 'Active' });
    const today = DateTime.now().setZone('Asia/Kolkata');
    for (const row of mockAppointments) {
        const [clock, ampm] = row.time.split(' ');
        let [hour, minute] = clock.split(':').map(Number);
        hour = hour % 12 + (ampm === 'PM' ? 12 : 0);
        const start = today.set({ hour, minute, second: 0, millisecond: 0 });
        await put('appointments', { ...row, clinicId: row.doctorId === 'arjun-mehta' ? 'CL-001' : row.doctorId === 'neha-sharma' ? 'CL-002' : 'CL-003', date: start.toISODate(), appointmentDate: start.toJSDate(), startTime: start.toUTC().toISO(), endTime: start.plus({ minutes: 30 }).toUTC().toISO() });
    }
    for (const row of mockInventory)
        await put('inventory', row);
    for (const row of services)
        await put('services', { ...row, status: row.active ? 'Active' : 'Inactive' });
    for (const [name, rows] of [['clinical-notes', clinical.mockClinicalNotes], ['consultations', clinical.mockConsultations], ['treatment-plans', clinical.mockTreatmentPlans], ['billing', clinical.mockInvoices]] as [
        Resource,
        any[]
    ][])
        for (const row of rows)
            await put(name, row);
    for (const row of mockDentalRecords)
        await put('records', { ...row, doctorId: row.doctor.includes('Neha') ? 'neha-sharma' : 'arjun-mehta' });
}
async function main() { const env = readEnv(); if (env.NODE_ENV === 'production')
    throw new Error('Seeding production is disabled'); const passwords = { admin: process.env.SEED_ADMIN_PASSWORD || '', doctor: process.env.SEED_DOCTOR_PASSWORD || '', patient: process.env.SEED_PATIENT_PASSWORD || '' }; if (Object.values(passwords).some(p => p.length < 12))
    throw new Error('Set all three SEED_*_PASSWORD values to at least 12 characters'); await connectDatabase(env.MONGODB_URI); try {
    await ensureIndexes();
    await seedFixtures(passwords);
    console.log('Seed completed without deleting existing records. Existing IDs were retained.');
}
finally {
    await disconnectDatabase();
} }
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename))
    main().catch(error => { console.error(error.message?.startsWith('Set ') || error.message === 'Seeding production is disabled' ? error.message : 'Seed failed. Check configuration, connectivity, and data conflicts.'); process.exitCode = 1; });
