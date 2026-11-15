import { ok, wrap } from '../middleware/index.js';
import type { PatientContract } from '../interfaces/services/contracts.js';
import { ResourceController } from './resource.controller.js';
export class PatientController extends ResourceController {
    constructor(private patients: PatientContract) { super(patients); }
    profile = wrap(async (req, res) => ok(res, await this.patients.get(req.actor!, req.actor!.patientId!)));
    updateProfile = wrap(async (req, res) => ok(res, await this.patients.update(req.actor!, req.actor!.patientId!, req.body)));
    favorites = wrap(async (req, res) => ok(res, await this.patients.favorites(req.actor!)));
    saveDoctor = (saved: boolean) => wrap(async (req, res) => ok(res, await this.patients.saveDoctor(req.actor!, String(req.params.id), saved)));
}
