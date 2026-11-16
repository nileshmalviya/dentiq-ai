import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// Resolve api/.env for both source execution and dist/src/config/env.js.
const environmentPath = [new URL('../../.env', import.meta.url), new URL('../../../.env', import.meta.url)]
    .map(url => fileURLToPath(url)).find(path => existsSync(path));
if (environmentPath)
    config({ path: environmentPath });
import { z } from 'zod';
const optionalCredential = z.preprocess(v => v === '' ? undefined : v, z.string().trim().min(1).optional());
const optionalRedirect = z.preprocess(v => v === '' ? undefined : v, z.string().url().refine(value => {
    const url = new URL(value);
    return !url.username && !url.password && !url.search && !url.hash && (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)));
}, 'Use HTTPS or localhost for OAuth callbacks').optional());
const socialEnvironment = {
    GOOGLE_CLIENT_ID: optionalCredential, GOOGLE_CLIENT_SECRET: optionalCredential, GOOGLE_REDIRECT_URI: optionalRedirect,
    FACEBOOK_CLIENT_ID: optionalCredential, FACEBOOK_CLIENT_SECRET: optionalCredential, FACEBOOK_REDIRECT_URI: optionalRedirect,
    LINKEDIN_CLIENT_ID: optionalCredential, LINKEDIN_CLIENT_SECRET: optionalCredential, LINKEDIN_REDIRECT_URI: optionalRedirect,
    FACEBOOK_GRAPH_VERSION: z.string().regex(/^v\d+\.0$/).default('v24.0'),
};
export function readEnv(input: NodeJS.ProcessEnv = process.env) {
    const optionalText=(schema:z.ZodString)=>z.preprocess(v=>v===''?undefined:v,schema.optional());
    const parsed = z.object({ ...socialEnvironment, NODE_ENV: z.enum(['development', 'test', 'production']).default('development'), PORT: z.coerce.number().int().min(1).max(65535).default(5000), MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//), JWT_ACCESS_SECRET: z.string().min(32), JWT_REFRESH_SECRET: z.string().min(32), CLIENT_URL: z.string().url(), SMTP_HOST:optionalText(z.string().min(1)),SMTP_PORT:z.coerce.number().int().min(1).max(65535).default(465),SMTP_SECURE:z.enum(["true","false"]).default("true"),SMTP_USER:optionalText(z.string().email()),SMTP_PASS:optionalText(z.string().min(1)),SMTP_FROM:optionalText(z.string().email()) }).safeParse(input);
    if (!parsed.success)
        throw new Error(`Invalid environment fields: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`);
    if (parsed.data.JWT_ACCESS_SECRET === parsed.data.JWT_REFRESH_SECRET)
        throw new Error('JWT secrets must be different');
    return parsed.data;
}
export type Env = ReturnType<typeof readEnv>;

