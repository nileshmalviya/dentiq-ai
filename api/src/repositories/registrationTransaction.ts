import mongoose from 'mongoose';
import { models } from '../models/resource.model.js';
import { clean } from './mongo.repository.js';
import type {
  RegistrationChange,
  NewRegistrationRecord,
} from '../interfaces/registration/contracts.js';
export async function commitRegistrationChanges(
  guard: RegistrationChange,
  writes: RegistrationChange[],
  creates: NewRegistrationRecord[],
) {
  return mongoose.connection.transaction(async (session) => {
    const row = await models[guard.collection]
      .findOneAndUpdate(guard.filter, guard.update, {
        new: true,
        runValidators: true,
        session,
      })
      .lean();
    if (!row) return null;
    for (const change of writes) {
      const result = await models[change.collection].updateOne(
        change.filter,
        change.update,
        { runValidators: true, session },
      );
      if (result.matchedCount !== 1)
        throw new Error('Related registration record is unavailable');
    }
    for (const record of creates)
      await models[record.collection].create([record.data], { session });
    return clean(row);
  });
}
