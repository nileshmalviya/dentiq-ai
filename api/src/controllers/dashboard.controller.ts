import { ok, wrap } from '../middleware/index.js';
import type { DashboardContract } from '../interfaces/services/contracts.js';
export class DashboardController {
    constructor(private service: DashboardContract) { }
    get = wrap(async (req, res) => ok(res, await this.service.calculate(req.actor!, Number(req.query.days || 30))));
}
