import type { Response } from 'express';
import type { Env } from '../config/env.js';
import type { AuthContract } from '../interfaces/services/contracts.js';
import { ok, wrap } from '../middleware/index.js';
export class AuthController {
    constructor(private auth: AuthContract, private env: Env) { }
    private get cookieOptions() { return { httpOnly: true, secure: this.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/api/v1/auth' }; }
    private session(res: Response, result: Awaited<ReturnType<AuthContract['login']>>) { res.cookie('dentiq_refresh', result.refreshToken, { ...this.cookieOptions, ...(result.remember ? { maxAge: 30 * 86400000 } : {}) }); return ok(res, { user: result.user, accessToken: result.accessToken }); }
    register = wrap(async (req, res) => ok(res, await this.auth.register(req.body), 201));
    login = wrap(async (req, res) => this.session(res, await this.auth.login(req.body.email, req.body.password, req.body.remember)));
    refresh = wrap(async (req, res) => { try {
        return this.session(res, await this.auth.refresh(req.cookies.dentiq_refresh || ''));
    }
    catch (error) {
        res.clearCookie('dentiq_refresh', this.cookieOptions);
        throw error;
    } });
    logout = wrap(async (req, res) => { await this.auth.logout(req.cookies.dentiq_refresh); res.clearCookie('dentiq_refresh', this.cookieOptions); return ok(res, null); });
    me = wrap(async (req, res) => ok(res, await this.auth.me(req.actor!)));
    forgotPassword = wrap(async (req) => this.auth.forgotPassword(req.body.email));
}
