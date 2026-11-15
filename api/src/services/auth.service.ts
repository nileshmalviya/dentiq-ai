import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'node:crypto';
import type { Env } from '../config/env.js';
import type { Actor, Row } from '../types/index.js';
import type { Repositories } from './resource.service.js';
import type { UnitOfWork } from '../interfaces/repositories/repository.js';
import { AppError } from '../errors/AppError.js';
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export function safeUser(user: Row) { const { passwordHash, ...safe } = user; return safe; }
export class AuthService {
    constructor(private repos: Repositories, private work: UnitOfWork, private env: Env) { }
    async forgotPassword(_email: string): Promise<never> { throw new AppError(503, 'Password recovery requires an email provider. Contact your clinic administrator.'); }
    async register(data: {
        name: string;
        email: string;
        password: string;
        phone: string;
    }) { const id = randomUUID(), patientId = randomUUID(); const user = { id, name: data.name, email: data.email, passwordHash: await bcrypt.hash(data.password, 12), role: 'PATIENT', status: 'Active', patientId }; await this.work.register(user, { id: patientId, userId: id, name: data.name, email: data.email, phone: data.phone, doctorIds: [], status: 'Active' }); return safeUser(user); }
    async login(email: string, password: string, remember: boolean) {
        const user = await this.repos.users.findOne({ email: email.toLowerCase(), status: 'Active' });
        const dummy = '$2b$12$5nPVskwmyWQ60okFS6I1nOBCRrXj9N9pKXUEGnqvdJ91yCaDlYoXm';
        const valid = await bcrypt.compare(password, user?.passwordHash || dummy);
        if (!user || !valid)
            throw new AppError(401, 'Incorrect email or password');
        return this.issue(user, remember);
    }
    private async issue(user: Row, remember: boolean) { const sessionId = randomUUID(); const refreshToken = jwt.sign({ sid: sessionId }, this.env.JWT_REFRESH_SECRET, { subject: user.id, expiresIn: remember ? '30d' : '1d', issuer: 'dentiq', audience: 'dentiq-refresh', algorithm: 'HS256' }); await this.repos.sessions.create({ id: sessionId, userId: user.id, tokenHash: digest(refreshToken), expiresAt: new Date(Date.now() + (remember ? 30 : 1) * 86400000), remember }); return { user: safeUser(user), accessToken: jwt.sign({}, this.env.JWT_ACCESS_SECRET, { subject: user.id, expiresIn: '15m', issuer: 'dentiq', audience: 'dentiq-api', algorithm: 'HS256' }), refreshToken, remember }; }
    async refresh(token: string) {
        let payload: jwt.JwtPayload;
        try {
            payload = jwt.verify(token, this.env.JWT_REFRESH_SECRET, { algorithms: ['HS256'], issuer: 'dentiq', audience: 'dentiq-refresh' }) as jwt.JwtPayload;
        }
        catch {
            throw new AppError(401, 'Session expired');
        }
        const consumed = await this.repos.sessions.delete({ id: payload.sid, userId: payload.sub, tokenHash: digest(token), expiresAt: { $gt: new Date() } });
        if (!consumed)
            throw new AppError(401, 'Session expired');
        const user = await this.repos.users.findOne({ id: payload.sub, status: 'Active' });
        if (!user)
            throw new AppError(401, 'Account unavailable');
        return this.issue(user, consumed.remember);
    }
    async authenticate(token: string): Promise<Actor> {
        let payload: jwt.JwtPayload;
        try {
            payload = jwt.verify(token, this.env.JWT_ACCESS_SECRET, { algorithms: ['HS256'], issuer: 'dentiq', audience: 'dentiq-api' }) as jwt.JwtPayload;
        }
        catch {
            throw new AppError(401, 'Authentication required');
        }
        const user = await this.repos.users.findOne({ id: payload.sub, status: 'Active' });
        if (!user)
            throw new AppError(401, 'Account unavailable');
        if (user.role === 'DOCTOR' && !await this.repos.doctors.findOne({ id: user.doctorId, status: 'Active' }))
            throw new AppError(403, 'Doctor account inactive');
        return { id: user.id, role: user.role, doctorId: user.doctorId, patientId: user.patientId, clinicId: user.clinicId };
    }
    async me(actor: Actor) {
        const user = await this.repos.users.findOne({ id: actor.id });
        if (!user)
            throw new AppError(401, 'Authentication required');
        return safeUser(user);
    }
    async logout(token: string | undefined) {
        if (token)
            await this.repos.sessions.delete({ tokenHash: digest(token) });
    }
}
