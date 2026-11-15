import { ok, wrap } from '../middleware/index.js';
import type { EmailVerificationService } from '../services/emailVerification.service.js';
export class EmailVerificationController {
  constructor(private service: EmailVerificationService) {}
  send = wrap(async (req, res) => ok(res, await this.service.send(req.actor!)));
  verify = wrap(async (req, res) =>
    ok(res, await this.service.verify(req.actor!, req.body.otp)),
  );
}
