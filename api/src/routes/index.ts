import {registerDoctorRegistrationRoutes} from './doctorRegistration.routes.js';
import type {Dependencies} from '../container/dependencies.js';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { Env } from '../config/env.js';
import { createDependencies } from '../container/dependencies.js';
import { registerAuthRoutes } from './auth.routes.js';
import { registerStaffRoutes } from './staff.routes.js';
import { registerInventoryRoutes } from './inventory.routes.js';
import { registerPatientRoutes } from './patient.routes.js';
import { registerPublicRoutes } from './public.routes.js';
import { registerChatRoutes } from './chat.routes.js';
export function createRoutes(env: Env, dependencies?:Dependencies) {
    const router = Router(), d = dependencies||createDependencies(env);
    const authLimit = rateLimit({ windowMs: 15 * 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many attempts; try later', errors: [] } }), publicLimit = rateLimit({ windowMs: 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many requests; try later', errors: [] } });
    registerAuthRoutes(router, d, authLimit, publicLimit);
    registerDoctorRegistrationRoutes(router,d);
    registerStaffRoutes(router, d, authLimit, publicLimit);
    registerInventoryRoutes(router, d, authLimit, publicLimit);
    registerPatientRoutes(router, d, authLimit, publicLimit);
    registerPublicRoutes(router, d, authLimit, publicLimit);
    registerChatRoutes(router, d, authLimit, publicLimit);
    return router;
}
