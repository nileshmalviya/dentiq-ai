import './env.js';
import { resolve, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = fileURLToPath(new URL('../../', import.meta.url));
export const apiDirectory =
  basename(directory.replace(/[\\/]$/, '')) === 'dist'
    ? dirname(directory.replace(/[\\/]$/, ''))
    : directory;
export const privateUploadDirectory = process.env.PRIVATE_UPLOAD_DIR
  ? resolve(process.env.PRIVATE_UPLOAD_DIR)
  : resolve(apiDirectory, 'storage', 'private');
