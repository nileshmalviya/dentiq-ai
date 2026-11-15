import { documentTypes } from '../constants/doctorRegistration.js';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import type { Actor } from '../types/index.js';
import type { Repositories } from '../interfaces/repositories/registry.js';
import type {
  RegistrationTransactionStore,
  PrivateDocumentStorage,
} from '../interfaces/registration/contracts.js';
import type { DoctorRegistrationService } from './doctorRegistration.service.js';
import { AppError } from '../errors/AppError.js';
import { publicDocument } from './doctorRegistrationPolicy.js';
export interface DocumentUpload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}
export class DocumentService {
  constructor(
    private repos: Repositories,
    private store: RegistrationTransactionStore,
    private registrations: DoctorRegistrationService,
    private storage: PrivateDocumentStorage,
  ) {}
  async upload(actor: Actor, type: string, file?: DocumentUpload) {
    if (!(documentTypes as readonly string[]).includes(type))
      throw new AppError(422, 'Unsupported document type');
    const a = await this.registrations.own(actor);
    if (!['DRAFT', 'REJECTED'].includes(a.requestStatus))
      throw new AppError(
        409,
        'Documents can only be changed on a draft or rejected application',
      );
    if (!file || !file.buffer.length || file.size > 10 * 1024 * 1024)
      throw new AppError(422, 'Choose a supported file of at most 10 MB');
    let extension = '',
      mime = '';
    const b = file.buffer;
    if (b.subarray(0, 5).toString() === '%PDF-') {
      extension = 'pdf';
      mime = 'application/pdf';
    } else if (
      b.length > 8 &&
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ) {
      extension = 'png';
      mime = 'image/png';
    } else if (b.length > 3 && b[0] === 255 && b[1] === 216 && b[2] === 255) {
      extension = 'jpg';
      mime = 'image/jpeg';
    } else
      throw new AppError(422, 'Only actual PDF, JPG or PNG files are accepted');
    const suffix = path.extname(file.originalname).toLowerCase();
    if (
      !(
        (['.jpg', '.jpeg'].includes(suffix) && extension === 'jpg') ||
        suffix === '.' + extension
      ) ||
      (file.mimetype !== mime && file.mimetype !== 'application/octet-stream')
    )
      throw new AppError(422, 'File content, name and type do not match');
    if (['PROFILE_PHOTO', 'CLINIC_LOGO'].includes(type) && extension === 'pdf')
      throw new AppError(422, 'Choose a JPG or PNG photo');
    const existing = await this.repos.documents.findMany({
      filter: { registrationId: a.id, active: true },
      sort: { createdAt: 1 },
      skip: 0,
      limit: 50,
    });
    const replacements =
      type === 'ADDITIONAL_QUALIFICATION'
        ? []
        : existing.filter((d) => d.documentType === type);
    if (existing.length - replacements.length >= 12)
      throw new AppError(422, 'A maximum of 12 current documents is allowed');
    const key = await this.storage.put(b, extension);
    const document = {
      id: randomUUID(),
      ownerId: actor.id,
      doctorId: a.doctorId,
      registrationId: a.id,
      documentType: type,
      secureStorageKey: key,
      originalName:
        path
          .basename(file.originalname)
          .replace(/[\x00-\x1f\x7f]/g, '')
          .slice(0, 180) || 'document.' + extension,
      mimeType: mime,
      size: file.size,
      sha256: createHash('sha256').update(b).digest('hex'),
      verificationStatus: 'PENDING',
      active: true,
    };
    try {
      const updated = await this.store.commit(
        {
          collection: 'doctor-registrations',
          filter: {
            id: a.id,
            version: a.version,
            requestStatus: a.requestStatus,
          },
          update: { $inc: { version: 1 } },
        },
        replacements.map((d) => ({
          collection: 'documents' as const,
          filter: { id: d.id, registrationId: a.id },
          update: { $set: { active: false } },
        })),
        [
          { collection: 'documents', data: document },
          {
            collection: 'doctor-approval-audits',
            data: {
              id: randomUUID(),
              doctorId: a.doctorId,
              registrationId: a.id,
              action: 'DOCUMENT_UPLOADED',
              performedBy: actor.id,
              reason: type,
            },
          },
        ],
      );
      if (!updated)
        throw new AppError(409, 'Registration changed; retry the upload');
    } catch (error) {
      await this.storage.remove(key);
      throw error;
    }
    return publicDocument(document);
  }
  async adminList(actor: Actor, id: string) {
    if (actor.role !== 'SUPER_ADMIN')
      throw new AppError(403, 'Administrator access required');
    if (!(await this.repos['doctor-registrations'].findOne({ id })))
      throw new AppError(404, 'Registration not found');
    return (
      await this.repos.documents.findMany({
        filter: { registrationId: id, active: true },
        sort: { createdAt: 1 },
        skip: 0,
        limit: 50,
      })
    ).map(publicDocument);
  }
  async download(actor: Actor, registrationId: string, id: string) {
    if (actor.role !== 'SUPER_ADMIN')
      throw new AppError(403, 'Administrator access required');
    const document = await this.repos.documents.findOne({
      id,
      registrationId,
      active: true,
    });
    if (!document || !(await this.storage.exists(document.secureStorageKey)))
      throw new AppError(404, 'Document not found');
    return {
      path: this.storage.path(document.secureStorageKey),
      name: document.originalName,
      mime: document.mimeType,
    };
  }
}
