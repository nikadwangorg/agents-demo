import { FastifyInstance } from 'fastify';
import { objectivesController } from '../controllers/objectives.controller.js';

export async function objectivesRoutes(fastify: FastifyInstance) {
  // Create a new objective
  fastify.post('/objectives', (request, reply) =>
    objectivesController.create(request, reply),
  );

  // Get all objectives
  fastify.get('/objectives', (request, reply) =>
    objectivesController.getAll(request, reply),
  );

  // Get objective by ID
  fastify.get('/objectives/:id', (request, reply) =>
    objectivesController.getById(request, reply),
  );

  // Delete objective
  fastify.delete('/objectives/:id', (request, reply) =>
    objectivesController.delete(request, reply),
  );
}
