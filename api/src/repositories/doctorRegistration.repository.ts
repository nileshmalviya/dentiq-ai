import mongoose from 'mongoose';
import { models } from '../models/resource.model.js';
import type {
  RegistrationTransactionStore,
  NewRegistrationRecord,
} from '../interfaces/registration/contracts.js';
import { commitRegistrationChanges } from './registrationTransaction.js';
export class DoctorRegistrationRepository implements RegistrationTransactionStore {
  async create(records: NewRegistrationRecord[]) {
    await mongoose.connection.transaction(async (session) => {
      for (const record of records)
        await models[record.collection].create([record.data], { session });
    });
  }
  commit = commitRegistrationChanges;
}
