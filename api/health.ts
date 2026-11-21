import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadBallotsAsync } from './_store';

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function handler(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const ballots = await loadBallotsAsync();
  sendJson(res, 200, { ok: true, sse: false, totalVoters: ballots.length });
}
