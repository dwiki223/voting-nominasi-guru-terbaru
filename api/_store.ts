import fs from 'node:fs';
import path from 'node:path';
import type { StoredBallot } from '../src/shared/constants.js';

const TMP_VOTES_FILE = path.join('/tmp', 'nominasi-guru-votes.json');
const KV_KEY = 'nominasi_guru:ballots';

function getRedisConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/+$/, ''), token };
  }
  return null;
}

export async function loadBallotsAsync(): Promise<StoredBallot[]> {
  const redis = getRedisConfig();
  if (redis) {
    try {
      const res = await fetch(`${redis.url}/get/${encodeURIComponent(KV_KEY)}`, {
        headers: { Authorization: `Bearer ${redis.token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { result?: string | null };
        if (typeof data.result === 'string' && data.result.length > 0) {
          const parsed = JSON.parse(data.result);
          return Array.isArray(parsed) ? (parsed as StoredBallot[]) : [];
        }
        return [];
      }
    } catch {
      // Fall back to /tmp storage if Redis request fails
    }
  }

  try {
    if (!fs.existsSync(TMP_VOTES_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(TMP_VOTES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredBallot[]) : [];
  } catch {
    return [];
  }
}

export async function saveBallotsAsync(ballots: StoredBallot[]): Promise<void> {
  const redis = getRedisConfig();
  if (redis) {
    try {
      const res = await fetch(`${redis.url}/set/${encodeURIComponent(KV_KEY)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redis.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(JSON.stringify(ballots)),
      });
      if (res.ok) {
        return;
      }
    } catch {
      // Fall back to /tmp storage if Redis request fails
    }
  }

  const tempFile = `${TMP_VOTES_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(ballots, null, 2), 'utf8');
  fs.renameSync(tempFile, TMP_VOTES_FILE);
}
