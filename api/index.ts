import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../src/infrastructure/config/app';

let app: Awaited<ReturnType<typeof buildApp>> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!app) {
      app = await buildApp();
      await app.ready();
    }
    app.server.emit('request', req, res);
  } catch (err) {
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}
