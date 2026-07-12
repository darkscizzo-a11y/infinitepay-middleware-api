// src/main.ts
import 'dotenv/config';
import { buildApp } from './infrastructure/config/app';

async function main(): Promise<void> {
  const app = await buildApp();
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

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
