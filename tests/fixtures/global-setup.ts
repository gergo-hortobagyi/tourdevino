import { execSync } from 'node:child_process';

function run(command: string): void {
  execSync(command, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...{
        NODE_ENV: 'test'
      }
    }
  });
}

export default async function globalSetup(): Promise<void> {
  run('bash ./scripts/start-local-postgres.sh');
  run('pnpm prisma generate');
  run('pnpm prisma migrate deploy');
  run('pnpm --filter api prisma:seed');
}
