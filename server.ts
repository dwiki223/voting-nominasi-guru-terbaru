import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import type { BallotSubmission, RecapSummary, StoredBallot } from './src/shared/constants';
import { buildVoterKey, computeRecap, validateBallot } from './src/shared/votingLogic';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(VOTES_FILE)) {
    fs.writeFileSync(VOTES_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function loadBallots(): StoredBallot[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(VOTES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredBallot[]) : [];
  } catch {
    return [];
  }
}

function saveBallots(ballots: StoredBallot[]): void {
  ensureDataFile();
  const tempFile = `${VOTES_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(ballots, null, 2), 'utf8');
  fs.renameSync(tempFile, VOTES_FILE);
}

let cachedBallots: StoredBallot[] = loadBallots();
const sseClients = new Set<Response>();

function getRecapSnapshot(): RecapSummary {
  return computeRecap(cachedBallots);
}

function broadcastRecap(recap: RecapSummary): void {
  const payload = `event: recap\ndata: ${JSON.stringify(recap)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, sse: true, totalVoters: cachedBallots.length });
  });

  app.get('/api/recap', (_req: Request, res: Response) => {
    res.json(getRecapSnapshot());
  });

  app.get('/api/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);
    const initial = getRecapSnapshot();
    res.write(`event: recap\ndata: ${JSON.stringify(initial)}\n\n`);

    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  app.post('/api/votes', (req: Request, res: Response) => {
    const body = req.body as BallotSubmission;
    const validation = validateBallot(body);
    if (!validation.valid) {
      res.status(400).json({ ok: false, error: validation.error });
      return;
    }

    const voterKey = buildVoterKey(validation.normalizedName, validation.validClass);
    const duplicate = cachedBallots.find((b) => b.normalizedVoterKey === voterKey);
    if (duplicate) {
      res.status(409).json({
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

    cachedBallots = [...cachedBallots, newBallot];
    saveBallots(cachedBallots);

    const recap = getRecapSnapshot();
    broadcastRecap(recap);

    res.status(201).json({
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
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
