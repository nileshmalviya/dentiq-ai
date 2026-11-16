import type { Router, RequestHandler } from 'express';
import type { Dependencies } from '../container/dependencies.js';
import { identity, validate } from '../middleware/index.js';
import { httpSchemas } from '../validations/http.validation.js';
import { registerSocialAuthRoutes } from './socialAuth.routes.js';
export function registerAuthRoutes(router: Router, d: Dependencies, authLimit: RequestHandler, publicLimit: RequestHandler) {
    const { controllers: c, auth } = d;
    registerSocialAuthRoutes(router, d, authLimit);
    router.post('/auth/register', authLimit, validate(httpSchemas.register), c.auth.register);
    router.post('/auth/login', authLimit, validate(httpSchemas.login), c.auth.login);
    router.post('/auth/refresh', authLimit, c.auth.refresh);
    router.post('/auth/logout', c.auth.logout);
    router.get('/auth/me', identity(auth), c.auth.me);
    router.post('/auth/forgot-password', authLimit, validate(httpSchemas.forgotPassword), c.auth.forgotPassword);
}
