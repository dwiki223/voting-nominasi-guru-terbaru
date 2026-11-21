import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadBallotsAsync } from './_store.js';

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function handler(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const ballots = await loadBallotsAsync();
    sendJson(res, 200, { ok: true, sse: false, totalVoters: ballots.length });
  } catch (error) {
    console.error('Error in /api/health:', error);
    sendJson(res, 500, { ok: false, error: 'Gagal memeriksa status server.' });
  }
}
