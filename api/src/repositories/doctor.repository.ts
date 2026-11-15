import { MongoRepository } from './mongo.repository.js';
export class DoctorRepository extends MongoRepository {
  constructor() {
    super('doctors');
  }
}
