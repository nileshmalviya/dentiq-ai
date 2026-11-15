import type { Request, Response, RequestHandler, ErrorRequestHandler } from 'express';
import type { z } from 'zod';
import { ZodError } from 'zod';
import type { Actor, Role } from '../types/index.js';
import { AppError } from '../errors/AppError.js';
import type { AuthService } from '../services/auth.service.js';
declare global {
    namespace Express {
        interface Request {
            actor?: Actor;
        }
    }
}
export const wrap = (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler => (req, res, next) => { Promise.resolve(fn(req, res)).catch(next); };
export const validate = (schema: z.ZodTypeAny): RequestHandler => (req, _res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    }
    catch (error) {
        next(error);
    }
};
// Authentication requires next() on success, unlike response-producing wrapped controllers.
export const identity = (auth: AuthService, required = true): RequestHandler => (req, res, next) => {
    Promise.resolve().then(async () => {
        const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
        if (token)
            req.actor = await auth.authenticate(token);
        else if (required)
            throw new AppError(401, 'Authentication required');
        next();
    }).catch(next);
};
export const authorize = (...roles: Role[]): RequestHandler => (req, _res, next) => {
    if (!req.actor || !roles.includes(req.actor.role))
        return next(new AppError(403, 'Access denied'));
    next();
};
export const ok = (res: Response, data: unknown, status = 200, pagination?: unknown, filters?: unknown) => res.status(status).json({ success: true, message: 'Operation completed successfully', data, ...(pagination ? { pagination } : {}), ...(filters ? { filters } : {}) });
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof AppError) {
        res.status(error.status).json({ success: false, message: error.message, errors: error.errors });
        return;
    }
    if (error instanceof ZodError) {
        res.status(422).json({ success: false, message: 'Validation failed', errors: error.issues.map(i => ({ path: i.path.join('.'), message: i.message })) });
        return;
    }
    if (error?.code === 11000) {
        res.status(409).json({ success: false, message: 'Record already exists or appointment slot was booked', errors: [] });
        return;
    }
    res.status(error?.type === 'entity.parse.failed' ? 400 : 500).json({ success: false, message: error?.type === 'entity.parse.failed' ? 'Invalid JSON' : 'The operation could not be completed', errors: [] });
};
