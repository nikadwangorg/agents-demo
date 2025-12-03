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

describe('Key Results API', () => {
  let objectiveId: string;

  beforeEach(async () => {
    // Create a test objective for each test
    const response = await supertest(app.server)
      .post('/objectives')
      .send({ title: 'Test Objective' });
    objectiveId = response.body.id;
  });

  describe('POST /objectives/:id/key-results', () => {
    it('should create a key result for an objective', async () => {
      const response = await supertest(app.server)
        .post(`/objectives/${objectiveId}/key-results`)
        .send({
          title: 'Get 100 users',
          targetValue: 100,
          unit: 'users',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Get 100 users',
        targetValue: 100,
        currentValue: 0,
        unit: 'users',
        objectiveId,
      });
      expect(response.body.id).toBeDefined();
    });

    it('should fail with non-existent objective', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await supertest(app.server)
        .post(`/objectives/${fakeId}/key-results`)
        .send({
          title: 'Orphan KR',
          targetValue: 50,
          unit: 'units',
        })
        .expect(404);

      expect(response.body.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should fail with negative target value', async () => {
      const response = await supertest(app.server)
        .post(`/objectives/${objectiveId}/key-results`)
        .send({
          title: 'Invalid KR',
          targetValue: -10,
          unit: 'units',
        })
        .expect(400);

      expect(response.body.code).toBe('INVALID_INPUT');
    });

    it('should fail with zero target value', async () => {
      const response = await supertest(app.server)
        .post(`/objectives/${objectiveId}/key-results`)
        .send({
          title: 'Invalid KR',
          targetValue: 0,
          unit: 'units',
        })
        .expect(400);

      expect(response.body.code).toBe('INVALID_INPUT');
    });

    it('should fail with missing required fields', async () => {
      const response = await supertest(app.server)
        .post(`/objectives/${objectiveId}/key-results`)
        .send({
          title: 'Incomplete KR',
        })
        .expect(400);

      expect(response.body.code).toBe('INVALID_INPUT');
    });
  });

  describe('PATCH /key-results/:id', () => {
    let keyResultId: string;

    beforeEach(async () => {
      const response = await supertest(app.server)
        .post(`/objectives/${objectiveId}/key-results`)
        .send({
          title: 'Test KR',
          targetValue: 100,
          unit: 'units',
        });
      keyResultId = response.body.id;
    });

    it('should update key result progress', async () => {
      const response = await supertest(app.server)
        .patch(`/key-results/${keyResultId}`)
        .send({ currentValue: 50 })
        .expect(200);

      expect(response.body).toMatchObject({
        id: keyResultId,
        currentValue: 50,
      });
    });

    it('should update to 100% completion', async () => {
      const response = await supertest(app.server)
        .patch(`/key-results/${keyResultId}`)
        .send({ currentValue: 100 })
        .expect(200);

      expect(response.body.currentValue).toBe(100);
    });

    it('should allow over-target values', async () => {
      const response = await supertest(app.server)
        .patch(`/key-results/${keyResultId}`)
        .send({ currentValue: 150 })
        .expect(200);

      expect(response.body.currentValue).toBe(150);
    });

    it('should fail with negative current value', async () => {
      const response = await supertest(app.server)
        .patch(`/key-results/${keyResultId}`)
        .send({ currentValue: -10 })
        .expect(400);

      expect(response.body.code).toBe('INVALID_INPUT');
    });

    it('should return 404 for non-existent key result', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await supertest(app.server)
        .patch(`/key-results/${fakeId}`)
        .send({ currentValue: 50 })
        .expect(404);

      expect(response.body.code).toBe('RESOURCE_NOT_FOUND');
    });
  });

  describe('DELETE /key-results/:id', () => {
    let keyResultId: string;

    beforeEach(async () => {
      const response = await supertest(app.server)
        .post(`/objectives/${objectiveId}/key-results`)
        .send({
          title: 'Test KR',
          targetValue: 100,
          unit: 'units',
        });
      keyResultId = response.body.id;
    });

    it('should delete a key result', async () => {
      await supertest(app.server)
        .delete(`/key-results/${keyResultId}`)
        .expect(204);

      // Verify deletion
      const kr = await prisma.keyResult.findUnique({
        where: { id: keyResultId },
      });
      expect(kr).toBeNull();
    });

    it('should return 404 for non-existent key result', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await supertest(app.server)
        .delete(`/key-results/${fakeId}`)
        .expect(404);

      expect(response.body.code).toBe('RESOURCE_NOT_FOUND');
    });
  });

  describe('Progress calculation integration', () => {
    it('should calculate objective progress correctly', async () => {
      // Create multiple KRs with different progress
      await supertest(app.server)
        .post(`/objectives/${objectiveId}/key-results`)
        .send({ title: 'KR1', targetValue: 100, unit: 'units' });

      const kr2Response = await supertest(app.server)
        .post(`/objectives/${objectiveId}/key-results`)
        .send({ title: 'KR2', targetValue: 200, unit: 'units' });

      // Update KR2 to 50% (100/200)
      await supertest(app.server)
        .patch(`/key-results/${kr2Response.body.id}`)
        .send({ currentValue: 100 });

      // Get objective and verify progress
      const response = await supertest(app.server)
        .get(`/objectives/${objectiveId}`)
        .expect(200);

      // Progress should be average: (0 + 50) / 2 = 25
      expect(response.body.progress).toBe(25);
    });

    it('should cap individual KR progress at 100%', async () => {
      const krResponse = await supertest(app.server)
        .post(`/objectives/${objectiveId}/key-results`)
        .send({ title: 'KR Over', targetValue: 100, unit: 'units' });

      // Set to 150% (150/100)
      await supertest(app.server)
        .patch(`/key-results/${krResponse.body.id}`)
        .send({ currentValue: 150 });

      const response = await supertest(app.server)
        .get(`/objectives/${objectiveId}`)
        .expect(200);

      // Progress should be capped at 100
      expect(response.body.progress).toBe(100);
    });
  });
});
