import mongoose, { Schema } from 'mongoose';
import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { models } from '../models/resource.model.js';
import { AppError } from '../errors/AppError.js';
import type { Row } from '../types/index.js';

const identitySchema = new Schema({ provider: { type: String, required: true }, subject: { type: String, required: true }, userId: { type: String, required: true } }, { versionKey: false });
identitySchema.index({ provider: 1, subject: 1 }, { unique: true });
const attemptSchema = new Schema({ stateHash: { type: String, required: true, unique: true }, browserHash: String, provider: String, verifier: String, nonce: String, issuer: String, expiresAt: Date }, { versionKey: false });
attemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Identity = mongoose.models['social-identities'] || mongoose.model('social-identities', identitySchema);
const Attempt = mongoose.models['social-attempts'] || mongoose.model('social-attempts', attemptSchema);

export interface SocialProfile { provider: string; subject: string; email: string; name: string; emailVerified: boolean }
export class SocialAuthRepository {
  async ensureIndexes() { await Identity.createIndexes(); await Attempt.createIndexes(); }
  async saveAttempt(data: Record<string, unknown>) { await Attempt.create(data); }
  async consumeAttempt(stateHash: string, browserHash: string, provider: string) {
    return Attempt.findOneAndDelete({ stateHash, browserHash, provider, expiresAt: { $gt: new Date() } }).lean() as Promise<Record<string, any> | null>;
  }
  async patient(profile: SocialProfile): Promise<Row> {
    const existing = await Identity.findOne({ provider: profile.provider, subject: profile.subject }).lean<{ userId: string }>();
    if (existing) {
      const user = await models.users.findOne({ id: existing.userId, role: 'PATIENT', status: 'Active' }).lean<Row>();
      if (!user || ['SUSPENDED', 'REJECTED', 'PENDING'].includes(user.accountStatus) || !await models.patients.exists({ id: user.patientId, userId: user.id, status: 'Active' })) throw new AppError(403, 'Patient account unavailable.');
      return user;
    }
    // Never link by email: this prevents provider email claims from taking over accounts.
    if (await models.users.exists({ email: profile.email })) throw new AppError(409, 'An account already uses this email. Please sign in with your existing login method.');
    const id = randomUUID(), patientId = randomUUID();
    const user = { id, patientId, name: profile.name, email: profile.email, emailVerified: profile.emailVerified, role: 'PATIENT', status: 'Active', passwordHash: await bcrypt.hash(randomBytes(48).toString('base64url'), 12) };
    try {
      await mongoose.connection.transaction(async session => {
        await models.users.create([user], { session });
        await models.patients.create([{ id: patientId, userId: id, name: profile.name, email: profile.email, phone: '', doctorIds: [], status: 'Active' }], { session });
        await Identity.create([{ provider: profile.provider, subject: profile.subject, userId: id }], { session });
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw new AppError(409, 'Account already exists. Please sign in again using your original login method.');
      throw error;
    }
    return user;
  }
}
