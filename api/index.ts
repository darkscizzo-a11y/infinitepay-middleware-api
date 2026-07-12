import 'dotenv/config';
import { buildApp } from '../src/infrastructure/config/app';

let app: Awaited<ReturnType<typeof buildApp>> | null = null;

export default async function handler(req: any, res: any) {
  try {
    if (!app) {
      app = await buildApp();
      await app.ready();
    }
    app.server.emit('request', req, res);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader?.('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error', detail: err?.message }));
  }
}
