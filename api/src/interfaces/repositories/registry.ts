import type { Repository } from './repository.js';
import type { Resource } from '../../validations/resource.validation.js';
export type Repositories = Record<Resource, Repository>;
