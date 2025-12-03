import { ZodSchema } from 'zod';
import { ValidationError } from './errors.js';

export function validateInput<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.errors.map(
      (e) => `${e.path.join('.')}: ${e.message}`,
    );
    throw new ValidationError(messages.join(', '));
  }
  return result.data;
}
