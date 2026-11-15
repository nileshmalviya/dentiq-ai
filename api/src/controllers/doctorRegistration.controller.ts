import { ok, wrap } from '../middleware/index.js';
import type { DoctorRegistrationService } from '../services/doctorRegistration.service.js';
import { registrationCatalog } from '../constants/doctorRegistration.js';
export class DoctorRegistrationController {
  constructor(private service: DoctorRegistrationService) {}
  config = wrap(async (_req, res) => ok(res, registrationCatalog));
  register = wrap(async (req, res) =>
    ok(res, await this.service.register(req.body), 201),
  );
  me = wrap(async (req, res) =>
    ok(res, await this.service.details(req.actor!)),
  );
  correct = wrap(async (req, res) =>
    ok(res, await this.service.correct(req.actor!, req.body)),
  );
  submit = wrap(async (req, res) =>
    ok(res, await this.service.submit(req.actor!, req.body.option)),
  );
}
