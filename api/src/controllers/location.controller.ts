import { ok, wrap } from '../middleware/index.js';
import type { DoctorSearchService } from '../services/doctor-search.service.js';
import type { ClinicLocationService } from '../services/clinic-location.service.js';
export class DoctorSearchController {
  constructor(private service: Pick<DoctorSearchService, 'search'>) {}
  search = wrap(async (req, res) => {
    const result = await this.service.search(req.query);
    return ok(res, result.data, 200, result.pagination);
  });
}
export class ClinicLocationController {
  constructor(private service: Pick<ClinicLocationService, 'list' | 'update'>) {}
  list = wrap(async (req, res) => ok(res, await this.service.list(req.actor!)));
  update = wrap(async (req, res) => ok(res, await this.service.update(req.actor!, String(req.params.id), req.body)));
}
