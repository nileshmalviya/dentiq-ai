import type { Criteria, Row } from '../../types/index.js';
import type { Resource } from '../../validations/resource.validation.js';
export interface NewRegistrationRecord {
  collection: Resource;
  data: Row;
}
export interface RegistrationChange {
  collection: Resource;
  filter: Criteria;
  update: Record<string, unknown>;
}
export interface RegistrationTransactionStore {
  create(records: NewRegistrationRecord[]): Promise<void>;
  commit(
    guard: RegistrationChange,
    writes: RegistrationChange[],
    creates: NewRegistrationRecord[],
  ): Promise<Row | null>;
}
export interface OtpStore {
  reserve(userId: string, data: Row, now: Date): Promise<Row | null>;
  delivery(
    userId: string,
    challengeId: string,
    status: 'SENT' | 'FAILED',
  ): Promise<void>;
  fail(filter: Criteria): Promise<Row | null>;
  consume(
    guard: RegistrationChange,
    writes: RegistrationChange[],
    audit: NewRegistrationRecord,
  ): Promise<Row | null>;
}
export interface ApprovalStore {
  decide(
    guard: RegistrationChange,
    writes: RegistrationChange[],
    audit: NewRegistrationRecord,
  ): Promise<Row | null>;
}
export interface RegistrationEmailSender {
  assertConfigured(): void;
  otp(to: string, name: string, code: string): Promise<void>;
  notification(
    to: string,
    name: string,
    event: string,
    reason?: string,
  ): Promise<void>;
}
export interface PrivateDocumentStorage {
  put(buffer: Buffer, extension: string): Promise<string>;
  path(key: string): string;
  remove(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
