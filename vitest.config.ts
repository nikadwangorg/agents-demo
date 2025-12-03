import { defineConfig } from 'vitest/config';
import { testDbConfig } from './tests/setup.js';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run tests sequentially to avoid database conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    globalSetup: './tests/setup.ts',
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDbConfig.DATABASE_URL,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/'],
    },
  },
});
