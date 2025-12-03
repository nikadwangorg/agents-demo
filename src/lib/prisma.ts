import { PrismaClient } from '@prisma/client';

/**
 * Singleton PrismaClient instance for database connections.
 * This ensures proper connection pooling and resource management
 * across all repositories.
 */
const prisma = new PrismaClient();

export default prisma;
