import type { ApprovalStore } from '../interfaces/registration/contracts.js';
import { commitRegistrationChanges } from './registrationTransaction.js';
export class DoctorApprovalRepository implements ApprovalStore {
  decide: ApprovalStore['decide'] = (guard, writes, audit) =>
    commitRegistrationChanges(guard, writes, [audit]);
}
