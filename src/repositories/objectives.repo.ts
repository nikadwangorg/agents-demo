import { Objective } from '@prisma/client';
import { CreateObjectiveInput } from '../models/objectives.model.js';
import prisma from '../lib/prisma.js';

export class ObjectivesRepository {
  async create(data: CreateObjectiveInput): Promise<Objective> {
    return prisma.objective.create({
      data: {
        title: data.title,
        description: data.description,
      },
    });
  }

  async findAll() {
    return prisma.objective.findMany({
      include: {
        keyResults: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return prisma.objective.findUnique({
      where: { id },
      include: {
        keyResults: true,
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.objective.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.objective.count({
      where: { id },
    });
    return count > 0;
  }
}

export const objectivesRepository = new ObjectivesRepository();
