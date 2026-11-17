import { confirmedClinicPoint } from './clinic-location.service.js';
import { verificationOptions } from '../constants/doctorRegistration.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { Actor, Row } from '../types/index.js';
import type { Repositories } from '../interfaces/repositories/registry.js';
import type {
  RegistrationTransactionStore,
  RegistrationEmailSender,
} from '../interfaces/registration/contracts.js';
import type { EmailVerificationService } from './emailVerification.service.js';
import { AppError } from '../errors/AppError.js';
import { definitions } from '../validations/resource.validation.js';
import {
  validateDoctorApplication,
  doctorApplicationRecords,
  missingRegistrationDocuments,
  publicDocument,
} from './doctorRegistrationPolicy.js';
export class DoctorRegistrationService {
  constructor(
    private repos: Repositories,
    private store: RegistrationTransactionStore,
    private otp: EmailVerificationService,
    private email: RegistrationEmailSender,
  ) {}
  async register(input: Record<string, any>) {
    if (Buffer.byteLength(String(input.password), 'utf8') > 72)
      throw new AppError(422, 'Password must use at most 72 UTF-8 bytes');
    this.email.assertConfigured();
    const { password, confirmPassword, clinicLocation, ...payload } = input;
    void confirmPassword;
    const data = validateDoctorApplication(payload),
      records = doctorApplicationRecords(data);
    if (await this.repos.users.findOne({ email: data.personal.email }))
      throw new AppError(409, 'Cannot register using these details');
    const userId = randomUUID(),
      doctorId = randomUUID(),
      clinicId = randomUUID(),
      registrationId = randomUUID();
    const user = {
      id: userId,
      ...definitions.users.parse({
        name: records.name,
        email: data.personal.email,
        phone: data.personal.phone,
        passwordHash: await bcrypt.hash(password, 12),
        role: 'DOCTOR',
        status: 'Active',
        accountStatus: 'PENDING',
        emailVerified: false,
        doctorId,
        clinicId,
      }),
    };
    const doctor = {
      id: doctorId,
      ...definitions.doctors.parse({
        ...records.doctor,
        name: records.name,
        userId,
        clinicId,
        clinicIds: [clinicId],
        registrationManaged: true,
        emailVerificationStatus: 'UNVERIFIED',
        approvalStatus: 'DRAFT',
        status: 'Under Review',
        registrationId,
        city: data.clinic.city,
        registrationDate: data.professional.registrationDate,
      }),
    };
    await this.store.create([
      { collection: 'users', data: user },
      { collection: 'doctors', data: doctor },
      {
        collection: 'clinics',
        data: {
          id: clinicId,
          ...definitions.clinics.parse({
            ...records.clinic,
            ...(clinicLocation ? { location: confirmedClinicPoint(clinicLocation) } : {}),
            status: 'Under Review',
          }),
        },
      },
      {
        collection: 'doctor-registrations',
        data: {
          id: registrationId,
          userId,
          doctorId,
          clinicId,
          ...data,
          registrationStep: 5,
          requestStatus: 'DRAFT',
          version: 0,
        },
      },
      {
        collection: 'doctor-clinics',
        data: {
          id: randomUUID(),
          doctorId,
          clinicId,
          isPrimary: true,
          status: 'PENDING',
        },
      },
      {
        collection: 'doctor-approval-audits',
        data: {
          id: randomUUID(),
          doctorId,
          registrationId,
          action: 'CREATED',
          performedBy: userId,
          reason: '',
        },
      },
    ]);
    let emailDeliveryStatus = 'SENT';
    try {
      await this.otp.send({ id: userId, role: 'DOCTOR', doctorId, clinicId });
    } catch {
      emailDeliveryStatus = 'FAILED';
    }
    return {
      registrationId,
      email: data.personal.email,
      emailDeliveryStatus,
      nextStep: '/doctor/verify-email',
      message:
        emailDeliveryStatus === 'SENT'
          ? 'Account created. Verify your email to continue.'
          : 'Account created, but email delivery failed. Sign in to retry verification.',
    };
  }
  async own(actor: Actor) {
    const row = await this.repos['doctor-registrations'].findOne({
      userId: actor.id,
      doctorId: actor.doctorId,
    });
    if (!row) throw new AppError(404, 'Registration not found');
    return row;
  }
  async details(actor: Actor, id?: string) {
    const application =
      id && actor.role === 'SUPER_ADMIN'
        ? await this.repos['doctor-registrations'].findOne({ id })
        : await this.own(actor);
    if (!application) throw new AppError(404, 'Registration not found');
    const [user, doctor, documents, audit, challenge] = await Promise.all([
      this.repos.users.findOne({ id: application.userId }),
      this.repos.doctors.findOne({ id: application.doctorId }),
      this.repos.documents.findMany({
        filter: { registrationId: application.id, active: true },
        sort: { createdAt: 1 },
        skip: 0,
        limit: 50,
      }),
      this.repos['doctor-approval-audits'].findMany({
        filter: { registrationId: application.id },
        sort: { createdAt: -1 },
        skip: 0,
        limit: 100,
      }),
      this.repos['email-verifications'].findOne({ userId: application.userId }),
    ]);
    return {
      application,
      doctor,
      emailVerified: user?.emailVerified === true,
      documents: documents.map(publicDocument),
      missingDocuments: missingRegistrationDocuments(application, documents),
      audit,
      otp: challenge
        ? {
            expiresAt: challenge.expiresAt,
            nextSendAt: challenge.nextSendAt,
            attemptCount: challenge.attemptCount,
            deliveryStatus: challenge.deliveryStatus,
          }
        : null,
    };
  }
  async correct(actor: Actor, input: Record<string, any>) {
    const application = await this.own(actor);
    if (!['DRAFT', 'REJECTED'].includes(application.requestStatus))
      throw new AppError(
        409,
        'This application cannot be edited while under review or approved',
      );
    const data = validateDoctorApplication({
      personal: { ...application.personal, ...input.personal },
      professional: input.professional || application.professional,
      clinic: input.clinic || application.clinic,
    });
    const records = doctorApplicationRecords(data);
    const changed = await this.store.commit(
      {
        collection: 'doctor-registrations',
        filter: {
          id: application.id,
          version: application.version,
          requestStatus: application.requestStatus,
        },
        update: { $set: data, $inc: { version: 1 } },
      },
      [
        {
          collection: 'doctors',
          filter: { id: application.doctorId },
          update: {
            $set: {
              ...records.doctor,
              name: records.name,
              city: data.clinic.city,
            },
          },
        },
        {
          collection: 'users',
          filter: { id: actor.id },
          update: { $set: { name: records.name, phone: data.personal.phone } },
        },
        {
          collection: 'clinics',
          filter: { id: application.clinicId },
          update: { $set: { ...records.clinic, ...(input.clinicLocation ? { location: confirmedClinicPoint(input.clinicLocation) } : {}) } },
        },
      ],
      [
        {
          collection: 'doctor-approval-audits',
          data: {
            id: randomUUID(),
            doctorId: application.doctorId,
            registrationId: application.id,
            action: 'CORRECTED',
            performedBy: actor.id,
            reason: '',
          },
        },
      ],
    );
    if (!changed)
      throw new AppError(409, 'Application changed; refresh and retry');
    return this.details(actor);
  }
  async submit(actor: Actor, option: string) {
    if (!(verificationOptions as readonly string[]).includes(option))
      throw new AppError(422, 'Choose a verification request option');
    const application = await this.own(actor),
      user = await this.repos.users.findOne({ id: actor.id });
    if (!user?.emailVerified)
      throw new AppError(403, 'Verify your email before submitting');
    if (!['DRAFT', 'REJECTED'].includes(application.requestStatus))
      throw new AppError(409, 'This request is already submitted');
    const details = await this.details(actor);
    validateDoctorApplication({
      personal: application.personal,
      professional: application.professional,
      clinic: application.clinic,
    });
    if (details.missingDocuments.length)
      throw new AppError(
        422,
        'Upload required documents: ' + details.missingDocuments.join(', '),
      );
    const now = new Date();
    const changed = await this.store.commit(
      {
        collection: 'doctor-registrations',
        filter: {
          id: application.id,
          version: application.version,
          requestStatus: application.requestStatus,
        },
        update: {
          $set: {
            requestStatus: 'PENDING',
            selectedVerificationOption: option,
            submittedAt: now,
            notificationStatus: 'PENDING',
          },
          $inc: { version: 1 },
        },
      },
      [
        {
          collection: 'doctors',
          filter: { id: application.doctorId },
          update: {
            $set: {
              approvalStatus: 'PENDING',
              status: 'Under Review',
              verificationOption: option,
            },
          },
        },
        {
          collection: 'users',
          filter: { id: actor.id },
          update: { $set: { accountStatus: 'PENDING' } },
        },
      ],
      [
        {
          collection: 'doctor-approval-audits',
          data: {
            id: randomUUID(),
            doctorId: application.doctorId,
            registrationId: application.id,
            action:
              application.requestStatus === 'REJECTED'
                ? 'RESUBMITTED'
                : 'SUBMITTED',
            performedBy: actor.id,
            reason: '',
          },
        },
      ],
    );
    if (!changed)
      throw new AppError(409, 'Application changed; refresh and retry');
    await this.notify(
      application,
      user,
      application.requestStatus === 'REJECTED' ? 'RESUBMITTED' : 'SUBMITTED',
    );
    return {
      message:
        'Your verification request has been submitted successfully to the Dentiq AI Support Team. Your account will be reviewed by our Super Admin.',
      ...(await this.details(actor)),
    };
  }
  async notify(application: Row, user: Row, event: string, reason = '') {
    let status = 'SENT';
    try {
      await this.email.notification(user.email, user.name, event, reason);
    } catch {
      status = 'FAILED';
    }
    await this.repos['doctor-registrations'].update(
      { id: application.id },
      { notificationStatus: status },
    );
    return status;
  }
}
