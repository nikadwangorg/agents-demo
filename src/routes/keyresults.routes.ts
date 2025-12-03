import { FastifyInstance } from 'fastify';
import { keyResultsController } from '../controllers/keyresults.controller.js';

export async function keyResultsRoutes(fastify: FastifyInstance) {
  // Create a key result for an objective
  fastify.post('/objectives/:id/key-results', (request, reply) =>
    keyResultsController.create(request, reply),
  );

  // Update key result progress
  fastify.patch('/key-results/:id', (request, reply) =>
    keyResultsController.update(request, reply),
  );

  // Delete key result
  fastify.delete('/key-results/:id', (request, reply) =>
    keyResultsController.delete(request, reply),
  );
}
