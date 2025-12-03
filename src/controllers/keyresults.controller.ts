import { FastifyRequest, FastifyReply } from 'fastify';
import { keyResultsService } from '../services/keyresults.service.js';
import {
  CreateKeyResultSchema,
  UpdateKeyResultSchema,
  KeyResultIdSchema,
} from '../models/keyresults.model.js';
import { ObjectiveIdSchema } from '../models/objectives.model.js';
import { validateInput } from '../utils/validation.js';
import { toErrorResponse, AppError } from '../utils/errors.js';

export class KeyResultsController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id: objectiveId } = validateInput(
        ObjectiveIdSchema,
        request.params,
      );
      const data = validateInput(CreateKeyResultSchema, request.body);
      const keyResult = await keyResultsService.createKeyResult(
        objectiveId,
        data,
      );
      return reply.code(201).send(keyResult);
    } catch (error) {
      const errorResponse = toErrorResponse(error);
      const statusCode =
        error instanceof AppError && error.code === 'RESOURCE_NOT_FOUND'
          ? 404
          : error instanceof AppError && error.code === 'INVALID_INPUT'
            ? 400
            : 500;
      return reply.code(statusCode).send(errorResponse);
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = validateInput(KeyResultIdSchema, request.params);
      const data = validateInput(UpdateKeyResultSchema, request.body);
      const keyResult = await keyResultsService.updateKeyResult(id, data);
      return reply.code(200).send(keyResult);
    } catch (error) {
      const errorResponse = toErrorResponse(error);
      const statusCode =
        error instanceof AppError && error.code === 'RESOURCE_NOT_FOUND'
          ? 404
          : error instanceof AppError && error.code === 'INVALID_INPUT'
            ? 400
            : 500;
      return reply.code(statusCode).send(errorResponse);
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = validateInput(KeyResultIdSchema, request.params);
      await keyResultsService.deleteKeyResult(id);
      return reply.code(204).send();
    } catch (error) {
      const errorResponse = toErrorResponse(error);
      const statusCode =
        error instanceof AppError && error.code === 'RESOURCE_NOT_FOUND'
          ? 404
          : error instanceof AppError && error.code === 'INVALID_INPUT'
            ? 400
            : 500;
      return reply.code(statusCode).send(errorResponse);
    }
  }
}

export const keyResultsController = new KeyResultsController();
