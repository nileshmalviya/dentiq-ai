import { DateTime } from 'luxon';
import type { Actor } from '../types/index.js';
import type { Repositories } from './resource.service.js';
import { AppError } from '../errors/AppError.js';
export class DashboardService {
    constructor(private repos: Repositories) { }
    async calculate(actor: Actor, days = 30) {
        if (![30, 90].includes(days))
            throw new AppError(400, 'Unsupported reporting period');
        const admin = actor.role === 'SUPER_ADMIN', scope = admin ? {} : { doctorId: actor.doctorId };
        const clinic = admin ? null : await this.repos.clinics.findOne({ id: actor.clinicId });
        const timezone = clinic?.timezone || 'Asia/Kolkata';
        const now = DateTime.now().setZone(timezone), from = now.minus({ days }).startOf('day').toJSDate();
        const [patients, doctors, activeDoctors, clinics, rating, totalAppointments, today, pending, plans, followups, completed, trend, treatments] = await Promise.all([
            this.repos.patients.countDocuments(admin ? {} : { doctorIds: actor.doctorId }), this.repos.doctors.countDocuments(admin ? {} : { id: actor.doctorId }), this.repos.doctors.countDocuments({ status: 'Active', ...(admin ? {} : { id: actor.doctorId }) }), this.repos.clinics.countDocuments(admin ? {} : { id: actor.clinicId }), this.repos.doctors.aggregate([{ $match: { status: 'Active', ...(admin ? {} : { id: actor.doctorId }) } }, { $group: { _id: null, value: { $avg: '$rating' } } }]), this.repos.appointments.countDocuments(scope),
            this.repos.appointments.countDocuments({ ...scope, appointmentDate: { $gte: now.startOf('day').toJSDate(), $lte: now.endOf('day').toJSDate() }, status: { $ne: 'Cancelled' } }), this.repos.consultations.countDocuments({ ...scope, status: 'Pending' }), this.repos['treatment-plans'].countDocuments(scope), this.repos['clinical-notes'].countDocuments({ ...scope, followUpAt: { $lte: now.endOf('day').toJSDate() } }), this.repos.appointments.countDocuments({ ...scope, status: 'Completed' }),
            this.repos.appointments.aggregate([{ $match: { ...scope, appointmentDate: { $gte: from }, status: { $ne: 'Cancelled' } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$appointmentDate', timezone } }, appointments: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, '$fee', 0] } } } }, { $sort: { _id: 1 } }]),
            this.repos.appointments.aggregate([{ $match: { ...scope, appointmentDate: { $gte: from }, status: { $ne: 'Cancelled' } } }, { $group: { _id: '$purpose', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }])
        ]);
        const stats = admin ? [{ label: 'Total Patients', value: String(patients), icon: 'users', tone: 'green' }, { label: 'Active Doctors', value: String(activeDoctors), icon: 'doctor', tone: 'blue' }, { label: 'Partner Clinics', value: String(clinics), icon: 'clinic', tone: 'green' }, { label: 'Avg. Rating', value: Number(rating[0]?.value || 0).toFixed(1), icon: 'star', tone: 'amber' }] : [{ label: "Today's Appointments", value: String(today), icon: 'calendar', tone: 'green' }, { label: 'Pending Consultations', value: String(pending), icon: 'users', tone: 'green' }, { label: 'Treatment Plans', value: String(plans), icon: 'clipboard', tone: 'green' }, { label: 'Follow-ups Due', value: String(followups), icon: 'followup', tone: 'amber' }];
        const capacityRows = await this.repos.doctors.aggregate([{ $match: admin ? { status: 'Active' } : { id: actor.doctorId, status: 'Active' } }, { $unwind: '$availability' }, { $match: { 'availability.day': now.weekday } }, { $project: { slots: { $size: '$availability.times' } } }, { $group: { _id: null, capacity: { $sum: '$slots' } } }]);
        const capacity = capacityRows[0]?.capacity || 0;
        const treatmentTotal = treatments.reduce((sum, r) => sum + r.count, 0);
        return { stats, patients, totalDoctors: doctors, activeDoctors, totalClinics: clinics, totalAppointments, averageRating: rating[0]?.value || 0, today, pending, plans, followups, completion: totalAppointments ? Math.round(completed / totalAppointments * 100) : 0, utilization: capacity ? Math.min(100, Math.round(today / capacity * 100)) : 0, trend: trend.map(row => ({ month: row._id, appointments: row.appointments, revenue: row.revenue })), topTreatments: treatments.map(row => ({ name: row._id, percent: Math.round(row.count / Math.max(treatmentTotal, 1) * 100) })) };
    }
}
