import { buildApp } from './app';
import { seed } from './db/seed';
import { startReminderJob } from './jobs/reminders';

async function main() {
  if (process.env.SEED_ON_BOOT !== 'false') {
    seed();
  }
  const app = await buildApp();
  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: '0.0.0.0' });
  console.log('API listening on ' + port);
  startReminderJob();
}

main();
