import { z } from 'zod';

// Zod validation schemas
export const CreateKeyResultSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  targetValue: z.number().positive('Target value must be positive'),
  unit: z.string().min(1, 'Unit is required'),
});

export const UpdateKeyResultSchema = z.object({
  currentValue: z.number().min(0, 'Current value must be non-negative'),
});

export const KeyResultIdSchema = z.object({
  id: z.string().uuid('Invalid key result ID'),
});

// TypeScript types
export type CreateKeyResultInput = z.infer<typeof CreateKeyResultSchema>;
export type UpdateKeyResultInput = z.infer<typeof UpdateKeyResultSchema>;
export type KeyResultId = z.infer<typeof KeyResultIdSchema>;

export interface KeyResult {
  id: string;
  objectiveId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  createdAt: Date;
}
