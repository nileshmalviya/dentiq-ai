import { DateTime } from 'luxon';
import { randomUUID } from 'node:crypto';
import { AppError } from '../errors/AppError.js';
import type { Actor } from '../types/index.js';
import { ResourceService } from './resource.service.js';
import { definitions, publicDoctor } from '../validations/resource.validation.js';
export const transitions: Record<string, string[]> = { Scheduled: ['Confirmed', 'Checked In', 'Cancelled'], Confirmed: ['Checked In', 'Cancelled'], 'Checked In': ['In Progress', 'Cancelled'], 'In Progress': ['Completed'], Completed: [], Cancelled: [] };
export class AppointmentService extends ResourceService {
    async availability(doctorId: string, date: string) {
        const doctor = await this.repos.doctors.findOne({ id: doctorId, status: 'Active', clinicalServicesEnabled:{$ne:false}, $or:[{registrationManaged:{$ne:true}},{approvalStatus:'APPROVED',emailVerificationStatus:'VERIFIED'}] });
        if (!doctor)
            throw new AppError(404, 'Doctor not found');
        const clinic = await this.repos.clinics.findOne({ id: doctor.clinicId, status: 'Active' });
        if (!clinic)
            throw new AppError(404, 'Clinic not available');
        const day = DateTime.fromISO(date, { zone: clinic.timezone });
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !day.isValid || day.startOf('day') < DateTime.now().setZone(clinic.timezone).startOf('day') || day > DateTime.now().plus({ days: 90 }))
            throw new AppError(422, 'Choose a date within the next 90 days');
        const configured = (doctor.availability as {
            day: number;
            times: string[];
        }[]).find(a => a.day === day.weekday)?.times || [];
        const times = configured.map(time => DateTime.fromISO(`${date}T${time}`, { zone: clinic.timezone })).filter(t => t.isValid && t > DateTime.now());
        const occupied = await this.repos.appointments.findMany({ filter: { doctorId, startTime: { $in: times.map(t => t.toUTC().toISO()) }, status: { $ne: 'Cancelled' } }, sort: { startTime: 1 }, skip: 0, limit: 100 });
        return { doctor: publicDoctor(doctor), date, timezone: clinic.timezone, slots: times.filter(t => !occupied.some(a => a.startTime === t.toUTC().toISO())).map(t => ({ startTime: t.toUTC().toISO(), endTime: t.plus({ minutes: doctor.slotDuration || 30 }).toUTC().toISO(), label: t.toFormat('h:mm a') })) };
    }
    async book(actor: Actor | undefined, input: Record<string, any>) {
        const { doctorId, date, startTime, reason } = input;
        const available = await this.availability(doctorId, date);
        const slot = available.slots.find(s => s.startTime === startTime);
        if (!slot)
            throw new AppError(409, 'Appointment slot is no longer available');
        let patient = actor?.role === 'PATIENT' ? await this.repos.patients.findOne({ id: actor.patientId, userId: actor.id }) : null;
        let guest;
        if (!patient) {
            guest = { id: randomUUID(), ...definitions.patients.parse({ ...input.patient, doctorIds: [] }) };
            patient = guest;
        }
        const doctor = available.doctor;
        const appointment = { id: randomUUID(), patientId: patient.id, patient: patient.name, doctorId, doctor: doctor.name, clinicId: doctor.clinicId, appointmentDate: new Date(slot.startTime!), startTime: slot.startTime, endTime: slot.endTime, date, time: slot.label, consultationType: 'In Person', status: 'Scheduled', purpose: reason || 'Consultation', reason: reason || '', notes: '', fee: doctor.fee };
        const result = await this.work.book(appointment, guest, patient.id);
        return { id: result.id, date: result.date, time: result.time, status: result.status, doctor: result.doctor, fee: result.fee };
    }
    async changeStatus(actor: Actor, id: string, status: string) {
        const old = await this.get(actor, id);
        if (!transitions[old.status]?.includes(status))
            throw new AppError(409, 'Invalid appointment status transition');
        const row = await this.work.transition(id, old.status, status, this.scope(actor));
        if (!row)
            throw new AppError(409, 'Appointment changed; refresh and retry');
        return row;
    }
}
