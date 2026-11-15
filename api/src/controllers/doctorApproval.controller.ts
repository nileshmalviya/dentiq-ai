import { ok, wrap } from '../middleware/index.js';
import type { DoctorApprovalService } from '../services/doctorApproval.service.js';
export class DoctorApprovalController {
  constructor(private service: DoctorApprovalService) {}
  list = wrap(async (req, res) => {
    const result = await this.service.list(req.actor!, req.query);
    return ok(res, result.data, 200, result.pagination);
  });
  details = wrap(async (req, res) =>
    ok(res, await this.service.details(req.actor!, String(req.params.id))),
  );
  audit = wrap(async (req, res) =>
    ok(
      res,
      (await this.service.details(req.actor!, String(req.params.id))).audit,
    ),
  );
  approve = wrap(async (req, res) =>
    ok(
      res,
      await this.service.decide(req.actor!, String(req.params.id), 'APPROVED'),
    ),
  );
  reject = wrap(async (req, res) =>
    ok(
      res,
      await this.service.decide(
        req.actor!,
        String(req.params.id),
        'REJECTED',
        req.body.reason,
      ),
    ),
  );
  retry = wrap(async (req, res) =>
    ok(
      res,
      await this.service.retryNotification(req.actor!, String(req.params.id)),
    ),
  );
}
