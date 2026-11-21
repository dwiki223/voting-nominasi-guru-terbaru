import type { IncomingMessage, ServerResponse } from 'node:http';
import { computeRecap } from '../src/shared/votingLogic.js';
import { loadBallotsAsync } from './_store.js';

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }
  try {
    const ballots = await loadBallotsAsync();
    sendJson(res, 200, computeRecap(ballots));
  } catch (error) {
    console.error('Error in /api/recap:', error);
    sendJson(res, 500, { ok: false, error: 'Gagal memuat rekapitulasi suara.' });
  }
}
