import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('INVALID_INPUT', message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('RESOURCE_NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super('INTERNAL_ERROR', message);
    this.name = 'InternalError';
  }
}

export function handleZodError(error: ZodError): ValidationError {
  const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return new ValidationError(messages.join(', '));
}

export interface ErrorResponse {
  code: string;
  message: string;
}

export function toErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
    };
  }
  
  if (error instanceof ZodError) {
    const validationError = handleZodError(error);
    return {
      code: validationError.code,
      message: validationError.message,
    };
  }

  console.error('Unexpected error:', error);
  return {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  };
}
