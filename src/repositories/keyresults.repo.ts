import { KeyResult } from '@prisma/client';
import {
  CreateKeyResultInput,
  UpdateKeyResultInput,
} from '../models/keyresults.model.js';
import prisma from '../lib/prisma.js';

export class KeyResultsRepository {
  async create(
    objectiveId: string,
    data: CreateKeyResultInput,
  ): Promise<KeyResult> {
    return prisma.keyResult.create({
      data: {
        objectiveId,
        title: data.title,
        targetValue: data.targetValue,
        unit: data.unit,
        currentValue: 0,
      },
    });
  }

  async findById(id: string): Promise<KeyResult | null> {
    return prisma.keyResult.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateKeyResultInput): Promise<KeyResult> {
    return prisma.keyResult.update({
      where: { id },
      data: {
        currentValue: data.currentValue,
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.keyResult.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async findByObjectiveId(objectiveId: string): Promise<KeyResult[]> {
    return prisma.keyResult.findMany({
      where: { objectiveId },
    });
  }
}

export const keyResultsRepository = new KeyResultsRepository();
