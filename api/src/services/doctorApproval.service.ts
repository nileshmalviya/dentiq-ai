import { randomUUID } from 'node:crypto';
import type { Actor } from '../types/index.js';
import type { Repositories } from '../interfaces/repositories/registry.js';
import type { ApprovalStore } from '../interfaces/registration/contracts.js';
import type { DoctorRegistrationService } from './doctorRegistration.service.js';
import type { PrivateDocumentStorage } from '../interfaces/registration/contracts.js';
import { AppError } from '../errors/AppError.js';
import { validateDoctorApplication } from './doctorRegistrationPolicy.js';
import { escapeSearch, pagination } from '../utils/query.js';
export class DoctorApprovalService {
  constructor(
    private repos: Repositories,
    private store: ApprovalStore,
    private registrations: DoctorRegistrationService,
    private storage: PrivateDocumentStorage,
  ) {}
  private admin(actor: Actor) {
    if (actor.role !== 'SUPER_ADMIN')
      throw new AppError(403, 'Administrator access required');
  }
  async list(actor: Actor, query: Record<string, unknown>) {
    this.admin(actor);
    const page = Number(query.page || 1),
      limit = Number(query.limit || 10);
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 100000 ||
      ![10, 25, 50, 100].includes(limit)
    )
      throw new AppError(400, 'Invalid page or page size');
    const filter: Record<string, unknown> = {};
    if (query.status) {
      if (
        !['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(
          String(query.status),
        )
      )
        throw new AppError(400, 'Invalid registration status');
      filter.requestStatus = query.status;
    }
    if (query.search) {
      if (typeof query.search !== 'string' || query.search.length > 200)
        throw new AppError(400, 'Invalid search');
      filter.$or = [
        'personal.firstName',
        'personal.lastName',
        'personal.email',
        'professional.registrationNumber',
        'clinic.name',
      ].map((field) => ({
        [field]: {
          $regex: escapeSearch(query.search as string),
          $options: 'i',
        },
      }));
    }
    const sortFields: Record<string, string> = {
      createdAt: 'createdAt',
      name: 'personal.firstName',
      email: 'personal.email',
      status: 'requestStatus',
    };
    const sortBy = String(query.sortBy || 'createdAt');
    if (
      !sortFields[sortBy] ||
      (query.sortOrder && !['asc', 'desc'].includes(String(query.sortOrder)))
    )
      throw new AppError(400, 'Invalid sorting');
    const [data, total] = await Promise.all([
      this.repos['doctor-registrations'].findMany({
        filter,
        sort: {
          [sortFields[sortBy]]: query.sortOrder === 'asc' ? 1 : -1,
          id: 1,
        },
        skip: (page - 1) * limit,
        limit,
      }),
      this.repos['doctor-registrations'].countDocuments(filter),
    ]);
    return { data, pagination: pagination(page, limit, total) };
  }
  details(actor: Actor, id: string) {
    this.admin(actor);
    return this.registrations.details(actor, id);
  }
  async decide(
    actor: Actor,
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    reason = '',
  ) {
    this.admin(actor);
    const details = await this.details(actor, id),
      a = details.application,
      user = await this.repos.users.findOne({ id: a.userId });
    if (!user) throw new AppError(404, 'Registration user not found');
    if (a.requestStatus === decision)
      return { ...details, alreadyReviewed: true };
    if (a.requestStatus !== 'PENDING')
      throw new AppError(409, 'Only pending applications can be reviewed');
    if (decision === 'APPROVED') {
      if (!details.emailVerified)
        throw new AppError(422, 'Email verification is required');
      validateDoctorApplication({
        personal: a.personal,
        professional: a.professional,
        clinic: a.clinic,
      });
      if (details.missingDocuments.length)
        throw new AppError(422, 'Required documents are missing');
      const stored = await this.repos.documents.findMany({
        filter: { registrationId: id, active: true },
        sort: { id: 1 },
        skip: 0,
        limit: 50,
      });
      for (const document of stored)
        if (!(await this.storage.exists(document.secureStorageKey)))
          throw new AppError(422, 'A verification document is unavailable');
    } else if (reason.trim().length < 10)
      throw new AppError(422, 'Provide a meaningful rejection reason');
    const approved = decision === 'APPROVED',
      now = new Date();
    const row = await this.store.decide(
      {
        collection: 'doctor-registrations',
        filter: { id, version: a.version, requestStatus: 'PENDING' },
        update: {
          $set: {
            requestStatus: decision,
            lastReviewedAt: now,
            rejectionReason: approved ? '' : reason,
            notificationStatus: 'PENDING',
          },
          $inc: { version: 1 },
        },
      },
      [
        {
          collection: 'doctors',
          filter: { id: a.doctorId },
          update: {
            $set: {
              approvalStatus: decision,
              status: approved ? 'Active' : 'Under Review',
              ...(approved
                ? { approvedBy: actor.id, approvedAt: now, rejectionReason: '' }
                : {
                    rejectedBy: actor.id,
                    rejectedAt: now,
                    rejectionReason: reason,
                  }),
            },
          },
        },
        {
          collection: 'users',
          filter: { id: a.userId, emailVerified: true },
          update: { $set: { accountStatus: approved ? 'ACTIVE' : 'REJECTED' } },
        },
        {
          collection: 'clinics',
          filter: { id: a.clinicId },
          update: { $set: { status: approved ? 'Active' : 'Under Review' } },
        },
        {
          collection: 'doctor-clinics',
          filter: { doctorId: a.doctorId, clinicId: a.clinicId },
          update: { $set: { status: approved ? 'ACTIVE' : 'PENDING' } },
        },
      ],
      {
        collection: 'doctor-approval-audits',
        data: {
          id: randomUUID(),
          doctorId: a.doctorId,
          registrationId: id,
          action: decision,
          performedBy: actor.id,
          reason: approved ? '' : reason,
        },
      },
    );
    if (!row)
      throw new AppError(
        409,
        'Another administrator already reviewed this request',
      );
    await this.registrations.notify(a, user, decision, reason);
    return this.details(actor, id);
  }
  async retryNotification(actor: Actor, id: string) {
    this.admin(actor);
    const a = await this.repos['doctor-registrations'].findOne({ id });
    if (!a || !['PENDING', 'APPROVED', 'REJECTED'].includes(a.requestStatus))
      throw new AppError(409, 'No review notification to resend');
    const user = await this.repos.users.findOne({ id: a.userId });
    if (!user) throw new AppError(404, 'User not found');
    await this.registrations.notify(
      a,
      user,
      a.requestStatus === 'PENDING' ? 'SUBMITTED' : a.requestStatus,
      a.rejectionReason || '',
    );
    return this.details(actor, id);
  }
}
