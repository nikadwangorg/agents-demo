import { execSync } from 'child_process';

const TEST_DATABASE_URL = 'file:./test.db';

export const testDbConfig = {
  DATABASE_URL: TEST_DATABASE_URL,
};

export default async function setup() {
  try {
    // Run prisma migrations to create test database tables
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: TEST_DATABASE_URL,
      },
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to apply Prisma migrations for test database:', error);
    throw error;
  }
}
