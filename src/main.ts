import 'dotenv/config';
import { buildApp } from './infrastructure/config/app';

let shuttingDown = false;

async function gracefulShutdown(signal: string, app: Awaited<ReturnType<typeof buildApp>>): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    await app.close();
    console.log('Server closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const app = await buildApp();
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM', app));
  process.on('SIGINT', () => gracefulShutdown('SIGINT', app));

  try {
    await app.listen({ port, host });
    app.log.info(`Server running on http://${host}:${port}`);
    app.log.info(`Swagger available at http://${host}:${port}/swagger`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

main();
