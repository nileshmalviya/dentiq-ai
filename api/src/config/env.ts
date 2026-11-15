import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// Resolve api/.env for both source execution and dist/src/config/env.js.
const environmentPath = [new URL('../../.env', import.meta.url), new URL('../../../.env', import.meta.url)]
    .map(url => fileURLToPath(url)).find(path => existsSync(path));
if (environmentPath) config({ path: environmentPath });
import { z } from 'zod';
export function readEnv(input: NodeJS.ProcessEnv = process.env) {
    const parsed = z.object({ NODE_ENV: z.enum(['development', 'test', 'production']).default('development'), PORT: z.coerce.number().int().min(1).max(65535).default(5000), MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//), JWT_ACCESS_SECRET: z.string().min(32), JWT_REFRESH_SECRET: z.string().min(32), CLIENT_URL: z.string().url() }).safeParse(input);
    if (!parsed.success)
        throw new Error(`Invalid environment fields: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`);
    if (parsed.data.JWT_ACCESS_SECRET === parsed.data.JWT_REFRESH_SECRET)
        throw new Error('JWT secrets must be different');
    return parsed.data;
}
export type Env = ReturnType<typeof readEnv>;
