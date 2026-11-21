import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { BallotSubmission, StoredBallot } from '../src/shared/constants.js';
import { buildVoterKey, computeRecap, validateBallot } from '../src/shared/votingLogic.js';
import { loadBallotsAsync, saveBallotsAsync } from './_store.js';

interface ApiRequest extends IncomingMessage {
  body?: unknown;
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: ApiRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (req.body === null) {
      return {};
    }
    if (typeof req.body === 'string') {
      const trimmed = req.body.trim();
      return trimmed ? JSON.parse(trimmed) : {};
    }
    return req.body;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req: ApiRequest, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  let body: BallotSubmission;
  try {
    body = (await readJsonBody(req)) as BallotSubmission;
  } catch {
    sendJson(res, 400, { ok: false, error: 'Format data tidak valid.' });
    return;
  }

  const validation = validateBallot(body);
  if (!validation.valid) {
    sendJson(res, 400, { ok: false, error: validation.error });
    return;
  }

  try {
    const ballots = await loadBallotsAsync();
    const voterKey = buildVoterKey(validation.normalizedName, validation.validClass);
    const duplicate = ballots.find((b) => b.normalizedVoterKey === voterKey);
    if (duplicate) {
      sendJson(res, 409, {
        ok: false,
        error: `Pemilih atas nama "${validation.normalizedName}" dari kelas ${validation.validClass} sudah pernah mengirimkan suara.`,
      });
      return;
    }

    const newBallot: StoredBallot = {
      id: crypto.randomUUID(),
      voterName: validation.normalizedName,
      normalizedVoterKey: voterKey,
      voterClass: validation.validClass,
      selections: validation.cleanSelections,
      submittedAt: new Date().toISOString(),
    };

    const nextBallots = [...ballots, newBallot];
    await saveBallotsAsync(nextBallots);
    const recap = computeRecap(nextBallots);

    sendJson(res, 201, {
      ok: true,
      ballot: {
        id: newBallot.id,
        voterName: newBallot.voterName,
        voterClass: newBallot.voterClass,
        selections: newBallot.selections,
        submittedAt: newBallot.submittedAt,
      },
      recap,
    });
  } catch (error) {
    console.error('Error in /api/votes:', error);
    sendJson(res, 500, {
      ok: false,
      error: 'Gagal menyimpan suara voting di server. Silakan coba beberapa saat lagi.',
    });
  }
}
