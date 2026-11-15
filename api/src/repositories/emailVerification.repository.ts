import { models } from '../models/resource.model.js';
import { clean } from './mongo.repository.js';
import type { OtpStore } from '../interfaces/registration/contracts.js';
import type { Row, Criteria } from '../types/index.js';
import { commitRegistrationChanges } from './registrationTransaction.js';
export class EmailVerificationRepository implements OtpStore {
  async reserve(userId: string, data: Row, now: Date) {
    try {
      const row = await models['email-verifications']
        .findOneAndUpdate(
          { userId, nextSendAt: { $lte: now } },
          { $set: data },
          { new: true, upsert: true, runValidators: true },
        )
        .lean();
      return row ? clean(row) : null;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return null;
      throw error;
    }
  }
  async delivery(
    userId: string,
    challengeId: string,
    status: 'SENT' | 'FAILED',
  ) {
    await models['email-verifications'].updateOne(
      { userId, challengeId },
      {
        $set: {
          deliveryStatus: status,
          ...(status === 'FAILED' ? { consumed: true, otpHash: '' } : {}),
        },
      },
    );
  }
  async fail(filter: Criteria) {
    const row = await models['email-verifications']
      .findOneAndUpdate(filter, { $inc: { attemptCount: 1 } }, { new: true })
      .lean();
    return row ? clean(row) : null;
  }
  consume: OtpStore['consume'] = (guard, writes, audit) =>
    commitRegistrationChanges(guard, writes, [audit]);
}
