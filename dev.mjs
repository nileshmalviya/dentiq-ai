import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('./', import.meta.url));
const backend = resolve(root, 'api');
const requireBackend = createRequire(resolve(backend, 'package.json'));
const { parse } = requireBackend('dotenv');
let settings = {};
try { settings = parse(readFileSync(resolve(backend, '.env'))); } catch { /* Startup validates missing configuration. */ }
const port = Number(process.env.PORT || settings.PORT || 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid backend PORT');
const target = `http://127.0.0.1:${port}`;
const children = new Set();
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
function launch(args, cwd, env = process.env) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit', windowsHide: true });
  children.add(child);
  child.on('error', error => { console.error(`Could not start development service: ${error.message}`); stop(1); });
  child.on('exit', code => { children.delete(child); if (!stopping) stop(code || 0); });
  return child;
}
async function apiReady() {
  try {
    const response = await fetch(`${target}/health`, { signal: AbortSignal.timeout(1500) });
    return response.ok && (await response.json()).data?.status === 'ok';
  } catch { return false; }
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

async function main() {
  if (!await apiReady()) {
    console.log('Starting Dentiq API and connecting to MongoDB...');
    launch(['--import', 'tsx', '--watch', 'src/server.ts'], backend);
    const deadline = Date.now() + 45000;
    while (!stopping && !await apiReady()) {
      if (Date.now() >= deadline) throw new Error('API did not start. Check api/.env and the API startup message above.');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } else console.log(`Using the running Dentiq API on port ${port}.`);
  if (!stopping) launch([resolve(root, 'app/node_modules/vite/bin/vite.js'), '--host', 'localhost', '--port', '5173', '--strictPort'], resolve(root,'app'), { ...process.env, DENTIQ_API_TARGET: target });
}
main().catch(error => { console.error(error.message); stop(1); });
