import type { Router, RequestHandler } from 'express';
import type { Dependencies } from '../container/dependencies.js';
import { identity, validate } from '../middleware/index.js';
import { httpSchemas } from '../validations/http.validation.js';
export function registerPublicRoutes(router: Router, d: Dependencies, authLimit: RequestHandler, publicLimit: RequestHandler) {
    const { controllers: c, auth } = d;
    for (const name of ['doctors', 'services'] as const)
        router.get(`/public/${name}`, publicLimit, c.public.list(name));
    router.get('/public/doctors/:id', publicLimit, c.public.doctor);
    router.get('/public/doctors/:id/availability', publicLimit, c.appointments.availability);
    router.post('/public/appointments', publicLimit, identity(auth, false), validate(httpSchemas.bookAppointment), c.appointments.book);
}
