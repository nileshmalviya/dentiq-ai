import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { Env } from '../config/env.js';
export function conversationOwner(req: Request, res: Response, env: Env) {
    if (req.actor)
        return `user:${req.actor.id}`;
    let key = req.cookies.dentiq_guest;
    if (typeof key !== 'string' || !/^[a-f0-9-]{36}$/.test(key)) {
        key = randomUUID();
        res.cookie('dentiq_guest', key, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1', maxAge: 86400000 });
    }
    return `guest:${key}`;
}
