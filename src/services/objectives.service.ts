import {
  CreateObjectiveInput,
  ObjectiveWithProgress,
} from '../models/objectives.model.js';
import { objectivesRepository } from '../repositories/objectives.repo.js';
import { progressService } from './progress.service.js';
import { NotFoundError } from '../utils/errors.js';

export class ObjectivesService {
  async createObjective(data: CreateObjectiveInput) {
    return objectivesRepository.create(data);
  }

  async getAllObjectives(): Promise<ObjectiveWithProgress[]> {
    const objectives = await objectivesRepository.findAll();

    return objectives.map((obj) => ({
      ...obj,
      progress: progressService.calculateObjectiveProgress(obj.keyResults),
    }));
  }

  async getObjectiveById(id: string): Promise<ObjectiveWithProgress> {
    const objective = await objectivesRepository.findById(id);

    if (!objective) {
      throw new NotFoundError('Objective');
    }

    return {
      ...objective,
      progress: progressService.calculateObjectiveProgress(
        objective.keyResults,
      ),
    };
  }

  async deleteObjective(id: string): Promise<void> {
    const deleted = await objectivesRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Objective');
    }
  }
}

export const objectivesService = new ObjectivesService();
