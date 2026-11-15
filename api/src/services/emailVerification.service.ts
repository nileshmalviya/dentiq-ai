import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import type { Repositories } from '../interfaces/repositories/registry.js';
import type {
  OtpStore,
  RegistrationEmailSender,
} from '../interfaces/registration/contracts.js';
import type { Actor } from '../types/index.js';
import { AppError } from '../errors/AppError.js';
export class EmailVerificationService {
  constructor(
    private repos: Repositories,
    private store: OtpStore,
    private email: RegistrationEmailSender,
    private secret: string,
  ) {}
  private hash(userId: string, challengeId: string, code: string) {
    return createHmac('sha256', this.secret)
      .update(`${userId}:${challengeId}:${code}`)
      .digest('hex');
  }
  async send(actor: Actor) {
    const user = await this.repos.users.findOne({
        id: actor.id,
        role: 'DOCTOR',
      }),
      registration = await this.repos['doctor-registrations'].findOne({
        userId: actor.id,
      });
    if (!user || !registration)
      throw new AppError(404, 'Registration not found');
    if (user.emailVerified)
      return { emailVerified: true, message: 'Email already verified' };
    this.email.assertConfigured();
    const now = new Date(),
      challengeId = randomUUID(),
      code = String(randomInt(100000, 1000000));
    const row = await this.store.reserve(
      user.id,
      {
        id: user.id,
        userId: user.id,
        challengeId,
        otpHash: this.hash(user.id, challengeId, code),
        expiresAt: new Date(now.getTime() + 300000),
        nextSendAt: new Date(now.getTime() + 60000),
        attemptCount: 0,
        consumed: false,
        deliveryStatus: 'PENDING',
      },
      now,
    );
    if (!row)
      throw new AppError(
        429,
        'Please wait 60 seconds before requesting another code',
      );
    try {
      await this.email.otp(user.email, user.name, code);
      await this.store.delivery(user.id, challengeId, 'SENT');
    } catch (error) {
      await this.store.delivery(user.id, challengeId, 'FAILED');
      throw error;
    }
    return {
      emailVerified: false,
      expiresAt: row.expiresAt,
      nextSendAt: row.nextSendAt,
      message: 'A verification code has been sent to your registered email',
    };
  }
  async verify(actor: Actor, code: string) {
    const challenge = await this.repos['email-verifications'].findOne({
        userId: actor.id,
      }),
      registration = await this.repos['doctor-registrations'].findOne({
        userId: actor.id,
      });
    if (!challenge || !registration)
      throw new AppError(422, 'Request a verification code first');
    const now = new Date();
    if (challenge.consumed)
      throw new AppError(409, 'This verification code is no longer usable');
    if (new Date(challenge.expiresAt) <= now)
      throw new AppError(
        410,
        'Verification code expired; request another code',
      );
    if (challenge.attemptCount >= 5)
      throw new AppError(
        429,
        'Too many incorrect attempts; request another code after the cooldown',
      );
    if (challenge.deliveryStatus !== 'SENT')
      throw new AppError(422, 'Request a new verification code');
    const digest = this.hash(actor.id, challenge.challengeId, code),
      correct =
        challenge.otpHash.length === digest.length &&
        timingSafeEqual(Buffer.from(challenge.otpHash), Buffer.from(digest));
    const filter = {
      userId: actor.id,
      challengeId: challenge.challengeId,
      consumed: false,
      deliveryStatus: 'SENT',
      expiresAt: { $gt: now },
      attemptCount: { $lt: 5 },
    };
    if (!correct) {
      const updated = await this.store.fail({
        ...filter,
        otpHash: { $ne: digest },
      });
      throw new AppError(
        updated && updated.attemptCount >= 5 ? 429 : 422,
        updated && updated.attemptCount >= 5
          ? 'Too many incorrect attempts; request another code after the cooldown'
          : 'Invalid verification code',
      );
    }
    const verified = await this.store.consume(
      {
        collection: 'email-verifications',
        filter: { ...filter, otpHash: digest },
        update: { $set: { consumed: true, verifiedAt: now, otpHash: '' } },
      },
      [
        {
          collection: 'users',
          filter: { id: actor.id },
          update: { $set: { emailVerified: true } },
        },
        {
          collection: 'doctors',
          filter: { id: registration.doctorId },
          update: { $set: { emailVerificationStatus: 'VERIFIED' } },
        },
      ],
      {
        collection: 'doctor-approval-audits',
        data: {
          id: randomUUID(),
          doctorId: registration.doctorId,
          registrationId: registration.id,
          action: 'EMAIL_VERIFIED',
          performedBy: actor.id,
          reason: '',
        },
      },
    );
    if (!verified)
      throw new AppError(409, 'Verification state changed. Please retry.');
    return { emailVerified: true, message: 'Email verified successfully' };
  }
}
