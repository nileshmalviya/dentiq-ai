import { ok, wrap } from '../middleware/index.js';
import type { PublicContract } from '../interfaces/services/contracts.js';
export class PublicController {
    constructor(private service: PublicContract) { }
    list = (name: 'doctors' | 'services') => wrap(async (req, res) => { const result = await this.service.list(name, req.query); return ok(res, result.data, 200, result.pagination); });
    doctor = wrap(async (req, res) => ok(res, await this.service.doctor(String(req.params.id))));
}
