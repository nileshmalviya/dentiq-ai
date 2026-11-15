import { ok, wrap } from '../middleware/index.js';
import { conversationOwner } from '../middleware/conversationOwner.js';
import type { ChatContract } from '../interfaces/services/contracts.js';
import type { Env } from '../config/env.js';
export class ChatController {
    constructor(private service: ChatContract, private env: Env) { }
    message = wrap(async (req, res) => ok(res, await this.service.message(conversationOwner(req, res, this.env), req.body.message, req.body.conversationId)));
    conversation = wrap(async (req, res) => ok(res, await this.service.conversation(conversationOwner(req, res, this.env), String(req.params.id))));
}
