import { updateClinicLocationSchema } from '../validations/location.validation.js';
import type { Router, RequestHandler } from 'express';
import type { Dependencies } from '../container/dependencies.js';
import { identity, authorize, validate } from '../middleware/index.js';
import { httpSchemas } from '../validations/http.validation.js';
import type { Resource } from '../validations/resource.validation.js';
export function registerStaffRoutes(router: Router, d: Dependencies, authLimit: RequestHandler, publicLimit: RequestHandler) {
    const { controllers: c, auth } = d;
    router.get('/doctor/clinic-locations', identity(auth), authorize('DOCTOR'), c.clinicLocations.list);
    router.patch('/doctor/clinic-locations/:id', identity(auth), authorize('DOCTOR'), publicLimit, validate(updateClinicLocationSchema), c.clinicLocations.update);
    for (const prefix of ['admin', 'doctor'] as const) {
        const access = [identity(auth), authorize(prefix === 'admin' ? 'SUPER_ADMIN' : 'DOCTOR')];
        for (const endpoint of ['dashboard', 'reports', 'analytics'])
            router.get(`/${prefix}/${endpoint}`, ...access, c.dashboard.get);
        router.get(`/${prefix}/settings`, ...access, c.auth.me);
        router.patch(`/${prefix}/settings`, ...access, validate(httpSchemas.settings), c.user.updateCurrent);
        const resources: Resource[] = prefix === 'admin' ? ['doctors', 'patients', 'clinics', 'appointments', 'services', 'clinical-notes', 'consultations', 'treatment-plans', 'billing', 'payments', 'records'] : ['patients', 'appointments', 'clinical-notes', 'consultations', 'treatment-plans', 'billing', 'records'];
        for (const name of resources) {
            const controller = c.resource(name);
            router.get(`/${prefix}/${name}`, ...access, controller.list());
            router.get(`/${prefix}/${name}/summary`, ...access, controller.summary);
            router.get(`/${prefix}/${name}/:id`, ...access, controller.get);
            if (name === 'appointments') {
                router.patch(`/${prefix}/${name}/:id`, ...access, validate(httpSchemas.appointmentStatus), c.appointments.changeStatus);
                continue;
            }
            const writable = prefix === 'admin' || ['clinical-notes', 'consultations', 'treatment-plans'].includes(name);
            if (writable) {
                router.post(`/${prefix}/${name}`, ...access, validate(httpSchemas.createResource(name)), controller.create);
                router.patch(`/${prefix}/${name}/:id`, ...access, validate(httpSchemas.updateResource(name)), controller.update);
                router.delete(`/${prefix}/${name}/:id`, ...access, controller.remove);
            }
        }
    }
}
