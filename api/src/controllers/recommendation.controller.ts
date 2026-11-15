import { ok, wrap } from '../middleware/index.js';
import { conversationOwner } from '../middleware/conversationOwner.js';
import type { RecommendationContract } from '../interfaces/services/contracts.js';
import type { Env } from '../config/env.js';
export class RecommendationController {
    constructor(private service: RecommendationContract, private env: Env) { }
    getDoctors = wrap(async (req, res) => ok(res, await this.service.recommend(conversationOwner(req, res, this.env), req.body.concern, req.body.search)));
}
