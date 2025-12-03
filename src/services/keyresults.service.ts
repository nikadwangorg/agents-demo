import {
  CreateKeyResultInput,
  UpdateKeyResultInput,
} from '../models/keyresults.model.js';
import { keyResultsRepository } from '../repositories/keyresults.repo.js';
import { objectivesRepository } from '../repositories/objectives.repo.js';
import { NotFoundError } from '../utils/errors.js';

export class KeyResultsService {
  async createKeyResult(objectiveId: string, data: CreateKeyResultInput) {
    // Verify objective exists
    const objectiveExists = await objectivesRepository.exists(objectiveId);
    if (!objectiveExists) {
      throw new NotFoundError('Objective');
    }

    return keyResultsRepository.create(objectiveId, data);
  }

  async updateKeyResult(id: string, data: UpdateKeyResultInput) {
    const keyResult = await keyResultsRepository.findById(id);
    if (!keyResult) {
      throw new NotFoundError('Key Result');
    }

    return keyResultsRepository.update(id, data);
  }

  async deleteKeyResult(id: string): Promise<void> {
    const deleted = await keyResultsRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Key Result');
    }
  }
}

export const keyResultsService = new KeyResultsService();
