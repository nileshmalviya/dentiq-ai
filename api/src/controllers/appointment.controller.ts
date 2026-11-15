import { ok, wrap } from '../middleware/index.js';
import type { AppointmentContract } from '../interfaces/services/contracts.js';
import { ResourceController } from './resource.controller.js';
export class AppointmentController extends ResourceController {
    constructor(private appointments: AppointmentContract) { super(appointments); }
    availability = wrap(async (req, res) => ok(res, await this.appointments.availability(String(req.params.id), String(req.query.date || ''))));
    book = wrap(async (req, res) => ok(res, await this.appointments.book(req.actor, req.body), 201));
    changeStatus = wrap(async (req, res) => ok(res, await this.appointments.changeStatus(req.actor!, String(req.params.id), req.body.status)));
}
