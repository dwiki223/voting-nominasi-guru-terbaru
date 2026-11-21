import type { IncomingMessage, ServerResponse } from 'node:http';
import { computeRecap } from '../src/shared/votingLogic';
import { loadBallotsAsync } from './_store';

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
  const ballots = await loadBallotsAsync();
  sendJson(res, 200, computeRecap(ballots));
}
