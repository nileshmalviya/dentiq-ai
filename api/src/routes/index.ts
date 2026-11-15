import { PatientService } from '../modules/patients/patient.service.js';
import { PublicService } from "../modules/resources/public.service.js";
import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { authorize, identity, ok, validate, wrap } from '../common/middleware/index.js';
import { repositories, MongoUnitOfWork } from '../modules/resources/resource.repository.js';
import { ResourceService } from '../modules/resources/resource.service.js';
import { definitions, type Resource } from '../modules/resources/resource.validation.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { AppointmentService } from '../modules/appointments/appointment.service.js';
import { InventoryService } from '../modules/inventory/inventory.service.js';
import { DashboardService } from '../modules/dashboards/dashboard.service.js';
import { ChatService } from '../modules/ai-chat/chat.service.js';
import type { Env } from '../config/env.js';
import { AppError } from '../common/errors/AppError.js';
export function createRoutes(env: Env) {
    const router = Router(), work = new MongoUnitOfWork(), auth = new AuthService(repositories, work, env), appointments = new AppointmentService('appointments', repositories, work), inventory = new InventoryService('inventory', repositories, work), dashboard = new DashboardService(repositories), chat = new ChatService(repositories), publicService = new PublicService(repositories);
    const cookieOptions = { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/api/v1/auth' };
    const session = (res: any, result: any) => { res.cookie('dentiq_refresh', result.refreshToken, { ...cookieOptions, ...(result.remember ? { maxAge: 30 * 86400000 } : {}) }); return ok(res, { user: result.user, accessToken: result.accessToken }); };
    const authLimit = rateLimit({ windowMs: 15 * 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many attempts; try later', errors: [] } });
    const publicLimit = rateLimit({ windowMs: 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many requests; try later', errors: [] } });
    router.post('/auth/register', authLimit, validate(z.object({ name: z.string().trim().min(2).max(120), email: z.string().email().toLowerCase(), password: z.string().min(12).max(72), phone: z.string().trim().min(7).max(30) }).strict()), wrap(async (req, res) => ok(res, await auth.register(req.body), 201)));
    router.post('/auth/login', authLimit, validate(z.object({ email: z.string().email().toLowerCase(), password: z.string().min(1).max(72), remember: z.boolean().default(false) }).strict()), wrap(async (req, res) => session(res, await auth.login(req.body.email, req.body.password, req.body.remember))));
    router.post('/auth/refresh', authLimit, wrap(async (req, res) => { try {
        return session(res, await auth.refresh(req.cookies.dentiq_refresh || ''));
    }
    catch (error) {
        res.clearCookie('dentiq_refresh', cookieOptions);
        throw error;
    } }));
    router.post('/auth/logout', wrap(async (req, res) => { await auth.logout(req.cookies.dentiq_refresh); res.clearCookie('dentiq_refresh', cookieOptions); return ok(res, null); }));
    router.get('/auth/me', identity(auth), wrap(async (req, res) => ok(res, await auth.me(req.actor!))));
    // Recovery cannot honestly claim to send mail without a configured mail provider.
    router.post('/auth/forgot-password', authLimit, validate(z.object({ email: z.string().email() })), wrap(async () => { throw new AppError(503, 'Password recovery requires an email provider. Contact your clinic administrator.'); }));
    for (const prefix of ['admin', 'doctor'] as const) {
        const access = [identity(auth), authorize(prefix === 'admin' ? 'SUPER_ADMIN' : 'DOCTOR')];
        for (const endpoint of ['dashboard', 'reports', 'analytics'])
            router.get(`/${prefix}/${endpoint}`, ...access, wrap(async (req, res) => ok(res, await dashboard.calculate(req.actor!, Number(req.query.days || 30)))));
        router.get(`/${prefix}/settings`, ...access, wrap(async (req, res) => ok(res, await auth.me(req.actor!))));
        router.patch(`/${prefix}/settings`, ...access, validate(definitions.users.pick({ name: true, email: true, phone: true, clinic: true, preferences: true }).partial().strict()), wrap(async (req, res) => ok(res, await new ResourceService('users', repositories, work).update(req.actor!, req.actor!.id, req.body))));
        const resources: Resource[] = prefix === 'admin' ? ['doctors', 'patients', 'clinics', 'appointments', 'services', 'clinical-notes', 'consultations', 'treatment-plans', 'billing', 'payments', 'records'] : ['patients', 'appointments', 'clinical-notes', 'consultations', 'treatment-plans', 'billing', 'records'];
        for (const name of resources) {
            const service = name === 'appointments' ? appointments : new ResourceService(name, repositories, work);
            router.get(`/${prefix}/${name}`, ...access, wrap(async (req, res) => { const result = await service.list(req.actor!, req.query); return ok(res, result.data, 200, result.pagination, result.filters); }));
            router.get(`/${prefix}/${name}/summary`, ...access, wrap(async (req, res) => ok(res, await service.summary(req.actor!))));
            router.get(`/${prefix}/${name}/:id`, ...access, wrap(async (req, res) => ok(res, await service.get(req.actor!, String(req.params.id)))));
            if (name === 'appointments') {
                router.patch(`/${prefix}/${name}/:id`, ...access, validate(z.object({ status: definitions.appointments.shape.status }).strict()), wrap(async (req, res) => ok(res, await appointments.changeStatus(req.actor!, String(req.params.id), req.body.status))));
                continue;
            }
            const writable = prefix === 'admin' || ['clinical-notes', 'consultations', 'treatment-plans'].includes(name);
            if (writable) {
                const createSchema = name === 'doctors' ? definitions.doctors.extend({ password: z.string().min(12).max(72) }) : definitions[name];
                router.post(`/${prefix}/${name}`, ...access, validate(createSchema.partial().strict()), wrap(async (req, res) => ok(res, await service.create(req.actor!, req.body), 201)));
                router.patch(`/${prefix}/${name}/:id`, ...access, validate(definitions[name].partial().strict()), wrap(async (req, res) => ok(res, await service.update(req.actor!, String(req.params.id), req.body))));
                router.delete(`/${prefix}/${name}/:id`, ...access, wrap(async (req, res) => ok(res, await service.remove(req.actor!, String(req.params.id)))));
            }
        }
    }
    const staff = [identity(auth), authorize('SUPER_ADMIN', 'DOCTOR')];
    router.get('/inventory/summary', ...staff, wrap(async (req, res) => ok(res, await inventory.summary(req.actor!))));
    router.get('/inventory/transactions', ...staff, wrap(async (req, res) => { const result = await new ResourceService('inventory-transactions', repositories, work).list(req.actor!, req.query); return ok(res, result.data, 200, result.pagination); }));
    for (const route of ['', '/low-stock', '/expiring-soon'])
        router.get(`/inventory${route}`, ...staff, wrap(async (req, res) => { const result = await inventory.list(req.actor!, { ...req.query, ...(route === '/low-stock' ? { stock: 'Low Stock' } : route ? { expiry: 'Expiring Soon' } : {}) }); return ok(res, result.data, 200, result.pagination); }));
    router.post('/inventory', ...staff, validate(definitions.inventory.omit({ doctorId: true, clinicId: true }).extend({ doctorId: z.string().optional(), clinicId: z.string().optional() }).strict()), wrap(async (req, res) => ok(res, await inventory.create(req.actor!, req.body), 201)));
    router.get('/inventory/:id', ...staff, wrap(async (req, res) => ok(res, await inventory.get(req.actor!, String(req.params.id)))));
    router.patch('/inventory/:id', ...staff, validate(definitions.inventory.partial().strict()), wrap(async (req, res) => ok(res, await inventory.update(req.actor!, String(req.params.id), req.body))));
    router.delete('/inventory/:id', ...staff, wrap(async (req, res) => ok(res, await inventory.remove(req.actor!, String(req.params.id)))));
    for (const direction of ['in', 'out'] as const)
        router.post(`/inventory/:id/stock-${direction}`, ...staff, validate(z.object({ amount: z.number().int().positive(), reason: z.string().max(1000).default('') }).strict()), wrap(async (req, res) => ok(res, await inventory.adjust(req.actor!, String(req.params.id), req.body.amount, direction, req.body.reason))));
    const patientAccess = [identity(auth), authorize('PATIENT')], patients = new PatientService('patients', repositories, work);
    router.get('/patient/favorites', ...patientAccess, wrap(async (req, res) => ok(res, await patients.favorites(req.actor!))));
    router.put('/patient/favorites/:id', ...patientAccess, wrap(async (req, res) => ok(res, await patients.saveDoctor(req.actor!, String(req.params.id), true))));
    router.delete('/patient/favorites/:id', ...patientAccess, wrap(async (req, res) => ok(res, await patients.saveDoctor(req.actor!, String(req.params.id), false))));
    router.get('/patient/profile', ...patientAccess, wrap(async (req, res) => ok(res, await patients.get(req.actor!, req.actor!.patientId!))));
    router.patch('/patient/profile', ...patientAccess, validate(definitions.patients.pick({ name: true, email: true, phone: true, age: true, gender: true }).partial().strict()), wrap(async (req, res) => ok(res, await patients.update(req.actor!, req.actor!.patientId!, req.body))));
    for (const name of ['appointments', 'records'] as const) {
        const service = new ResourceService(name, repositories, work);
        router.get(`/patient/${name}`, ...patientAccess, wrap(async (req, res) => { const result = await service.list(req.actor!, req.query); return ok(res, result.data, 200, result.pagination); }));
        router.get(`/patient/${name}/:id`, ...patientAccess, wrap(async (req, res) => ok(res, await service.get(req.actor!, String(req.params.id)))));
    }
    for (const name of ['doctors', 'services'] as const)
        router.get(`/public/${name}`, publicLimit, wrap(async (req, res) => { const result = await publicService.list(name, req.query); return ok(res, result.data, 200, result.pagination); }));
    router.get('/public/doctors/:id', publicLimit, wrap(async (req, res) => { return ok(res, await publicService.doctor(String(req.params.id))); }));
    router.get('/public/doctors/:id/availability', publicLimit, wrap(async (req, res) => ok(res, await appointments.availability(String(req.params.id), String(req.query.date || '')))));
    router.post('/public/appointments', publicLimit, identity(auth, false), validate(z.object({ doctorId: z.string().min(1), date: z.string(), startTime: z.string().datetime(), reason: z.string().trim().min(1).max(1000), patient: z.object({ name: z.string().trim().min(2).max(120), email: z.string().email(), phone: z.string().regex(/^[+\d ()-]{7,30}$/) }).optional() }).strict()), wrap(async (req, res) => ok(res, await appointments.book(req.actor, req.body), 201)));
    const guest = (req: any, res: any) => { if (req.actor)
        return `user:${req.actor.id}`; let key = req.cookies.dentiq_guest; if (typeof key !== 'string' || !/^[a-f0-9-]{36}$/.test(key)) {
        key = randomUUID();
        res.cookie('dentiq_guest', key, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1', maxAge: 86400000 });
    } return `guest:${key}`; };
    router.post('/recommendations/doctors', publicLimit, identity(auth, false), validate(z.object({ concern: z.string().max(4000), search: z.string().max(200).default('') })), wrap(async (req, res) => ok(res, await chat.recommend(guest(req, res), req.body.concern, req.body.search))));
    router.post('/ai-chat/message', publicLimit, identity(auth, false), validate(z.object({ message: z.string().trim().min(1).max(4000), conversationId: z.string().uuid().optional() })), wrap(async (req, res) => ok(res, await chat.message(guest(req, res), req.body.message, req.body.conversationId))));
    router.get('/ai-chat/conversations/:id', publicLimit, identity(auth, false), wrap(async (req, res) => ok(res, await chat.conversation(guest(req, res), String(req.params.id)))));
    return router;
}
