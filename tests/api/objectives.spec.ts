import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
  // Clean database once at start
  await prisma.keyResult.deleteMany();
  await prisma.objective.deleteMany();
}, 30000);

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
}, 30000);

describe('Objectives API', () => {
  describe('POST /objectives', () => {
    it('should create a new objective with title only', async () => {
      const response = await supertest(app.server)
        .post('/objectives')
        .send({ title: 'Launch MVP' })
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Launch MVP',
        description: null,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should create a new objective with title and description', async () => {
      const response = await supertest(app.server)
        .post('/objectives')
        .send({
          title: 'Expand Market',
          description: 'Enter 3 new markets',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Expand Market',
        description: 'Enter 3 new markets',
      });
    });

    it('should fail with empty title', async () => {
      const response = await supertest(app.server)
        .post('/objectives')
        .send({ title: '' })
        .expect(400);

      expect(response.body.code).toBe('INVALID_INPUT');
    });

    it('should fail with missing title', async () => {
      const response = await supertest(app.server)
        .post('/objectives')
        .send({})
        .expect(400);

      expect(response.body.code).toBe('INVALID_INPUT');
    });
  });

  describe('GET /objectives', () => {
    it('should return empty array when no objectives exist', async () => {
      // Clean database for this specific test
      await prisma.keyResult.deleteMany();
      await prisma.objective.deleteMany();
      
      const response = await supertest(app.server)
        .get('/objectives')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all objectives with progress', async () => {
      // Clean database for this specific test
      await prisma.keyResult.deleteMany();
      await prisma.objective.deleteMany();
      
      // Create objective
      const obj1 = await supertest(app.server)
        .post('/objectives')
        .send({ title: 'Objective 1' });

      // Create objective with KR
      const obj2 = await supertest(app.server)
        .post('/objectives')
        .send({ title: 'Objective 2' });

      await supertest(app.server)
        .post(`/objectives/${obj2.body.id}/key-results`)
        .send({ title: 'Get 100 users', targetValue: 100, unit: 'users' });

      const response = await supertest(app.server)
        .get('/objectives')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('progress');
      expect(response.body[0].progress).toBe(0); // Objective 2 with 0% progress
      expect(response.body[1].progress).toBe(0); // Objective 1 with no KRs
    });
  });

  describe('GET /objectives/:id', () => {
    it('should return objective by id with progress', async () => {
      const createResponse = await supertest(app.server)
        .post('/objectives')
        .send({ title: 'Test Objective' });

      const objectiveId = createResponse.body.id;

      const response = await supertest(app.server)
        .get(`/objectives/${objectiveId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: objectiveId,
        title: 'Test Objective',
        progress: 0,
      });
      expect(response.body.keyResults).toEqual([]);
    });

    it('should return 404 for non-existent objective', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await supertest(app.server)
        .get(`/objectives/${fakeId}`)
        .expect(404);

      expect(response.body.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await supertest(app.server)
        .get('/objectives/invalid-id')
        .expect(400);

      expect(response.body.code).toBe('INVALID_INPUT');
    });
  });

  describe('DELETE /objectives/:id', () => {
    it('should delete an objective', async () => {
      const createResponse = await supertest(app.server)
        .post('/objectives')
        .send({ title: 'To Delete' });

      const objectiveId = createResponse.body.id;

      await supertest(app.server)
        .delete(`/objectives/${objectiveId}`)
        .expect(204);

      // Verify it's deleted
      await supertest(app.server)
        .get(`/objectives/${objectiveId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent objective', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await supertest(app.server)
        .delete(`/objectives/${fakeId}`)
        .expect(404);

      expect(response.body.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should cascade delete key results', async () => {
      // Create objective with KR
      const objResponse = await supertest(app.server)
        .post('/objectives')
        .send({ title: 'Parent Objective' });

      const objectiveId = objResponse.body.id;

      await supertest(app.server)
        .post(`/objectives/${objectiveId}/key-results`)
        .send({ title: 'Child KR', targetValue: 100, unit: 'units' });

      // Delete objective
      await supertest(app.server)
        .delete(`/objectives/${objectiveId}`)
        .expect(204);

      // Verify cascade deletion worked
      const krs = await prisma.keyResult.findMany({
        where: { objectiveId },
      });
      expect(krs).toHaveLength(0);
    });
  });
});
