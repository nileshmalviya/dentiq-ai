import type { Router, RequestHandler } from 'express';
import type { Dependencies } from '../container/dependencies.js';
import { identity, authorize, validate } from '../middleware/index.js';
import { httpSchemas } from '../validations/http.validation.js';
export function registerPatientRoutes(router: Router, d: Dependencies, authLimit: RequestHandler, publicLimit: RequestHandler) {
    const { controllers: c, auth } = d;
    const patientAccess = [identity(auth), authorize('PATIENT')];
    router.get('/patient/favorites', ...patientAccess, c.patients.favorites);
    router.put('/patient/favorites/:id', ...patientAccess, c.patients.saveDoctor(true));
    router.delete('/patient/favorites/:id', ...patientAccess, c.patients.saveDoctor(false));
    router.get('/patient/profile', ...patientAccess, c.patients.profile);
    router.patch('/patient/profile', ...patientAccess, validate(httpSchemas.patientProfile), c.patients.updateProfile);
    for (const name of ['appointments', 'records'] as const) {
        const controller = c.resource(name);
        router.get(`/patient/${name}`, ...patientAccess, controller.list(false));
        router.get(`/patient/${name}/:id`, ...patientAccess, controller.get);
    }
}
