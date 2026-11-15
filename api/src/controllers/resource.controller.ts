import { ok, wrap } from '../middleware/index.js';
import type { ResourceContract } from '../interfaces/services/contracts.js';
export class ResourceController {
    constructor(protected service: ResourceContract) { }
    list = (filters = true) => wrap(async (req, res) => { const result = await this.service.list(req.actor!, req.query); return ok(res, result.data, 200, result.pagination, filters ? result.filters : undefined); });
    summary = wrap(async (req, res) => ok(res, await this.service.summary(req.actor!)));
    get = wrap(async (req, res) => ok(res, await this.service.get(req.actor!, String(req.params.id))));
    create = wrap(async (req, res) => ok(res, await this.service.create(req.actor!, req.body), 201));
    update = wrap(async (req, res) => ok(res, await this.service.update(req.actor!, String(req.params.id), req.body)));
    remove = wrap(async (req, res) => ok(res, await this.service.remove(req.actor!, String(req.params.id))));
    updateCurrent = wrap(async (req, res) => ok(res, await this.service.update(req.actor!, req.actor!.id, req.body)));
}
