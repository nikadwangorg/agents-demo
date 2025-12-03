import { FastifyRequest, FastifyReply } from 'fastify';
import { objectivesService } from '../services/objectives.service.js';
import {
  CreateObjectiveSchema,
  ObjectiveIdSchema,
} from '../models/objectives.model.js';
import { validateInput } from '../utils/validation.js';
import { toErrorResponse, AppError } from '../utils/errors.js';

export class ObjectivesController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = validateInput(CreateObjectiveSchema, request.body);
      const objective = await objectivesService.createObjective(data);
      return reply.code(201).send(objective);
    } catch (error) {
      const errorResponse = toErrorResponse(error);
      const statusCode = error instanceof AppError && error.code === 'INVALID_INPUT' ? 400 : 500;
      return reply.code(statusCode).send(errorResponse);
    }
  }

  async getAll(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const objectives = await objectivesService.getAllObjectives();
      return reply.code(200).send(objectives);
    } catch (error) {
      const errorResponse = toErrorResponse(error);
      return reply.code(500).send(errorResponse);
    }
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = validateInput(ObjectiveIdSchema, request.params);
      const objective = await objectivesService.getObjectiveById(id);
      return reply.code(200).send(objective);
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
      const { id } = validateInput(ObjectiveIdSchema, request.params);
      await objectivesService.deleteObjective(id);
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

export const objectivesController = new ObjectivesController();
