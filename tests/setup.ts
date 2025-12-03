import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function setup() {
  console.log('Setting up test database...');
  try {
    await execAsync('npx prisma migrate deploy');
    console.log('Test database ready!');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}
