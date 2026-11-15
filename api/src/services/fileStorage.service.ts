import { mkdir, writeFile, unlink, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { privateUploadDirectory } from '../config/storage.js';
import type { PrivateDocumentStorage } from '../interfaces/registration/contracts.js';
export class FileStorageService implements PrivateDocumentStorage {
  path(key: string) {
    if (!/^[a-f0-9-]{36}\.(pdf|jpg|png)$/.test(key))
      throw new Error('Invalid private storage key');
    return resolve(privateUploadDirectory, key);
  }
  async put(buffer: Buffer, extension: string) {
    await mkdir(privateUploadDirectory, { recursive: true });
    const key = randomUUID() + '.' + extension;
    await writeFile(this.path(key), buffer, { flag: 'wx', mode: 0o600 });
    return key;
  }
  async remove(key: string) {
    await unlink(this.path(key)).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
  async exists(key: string) {
    try {
      await access(this.path(key));
      return true;
    } catch {
      return false;
    }
  }
}
