import { z } from 'zod';

// Zod validation schemas
export const CreateObjectiveSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

export const ObjectiveIdSchema = z.object({
  id: z.string().uuid('Invalid objective ID'),
});

// TypeScript types
export type CreateObjectiveInput = z.infer<typeof CreateObjectiveSchema>;
export type ObjectiveId = z.infer<typeof ObjectiveIdSchema>;

export interface Objective {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
}

export interface ObjectiveWithProgress extends Objective {
  keyResults: Array<{
    id: string;
    title: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    createdAt: Date;
  }>;
  progress: number;
}
