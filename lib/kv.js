// KV history store (Vercel KV / Upstash Redis via REST). No npm dependency.
// Reports configured=false when the env vars are absent so callers can fall back.
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'lumnia:history';
const CAP = 200;

export const kvConfigured = () => Boolean(KV_URL && KV_TOKEN);

async function cmd(command) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`KV ${res.status}`);
  return (await res.json()).result;
}

export async function getSnapshots() {
  const raw = await cmd(['LRANGE', KEY, '0', '-1']);
  return (raw || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
}

export async function lastSnapshot() {
  const raw = await cmd(['LINDEX', KEY, '-1']);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function pushSnapshot(snap) {
  await cmd(['RPUSH', KEY, JSON.stringify(snap)]);
  await cmd(['LTRIM', KEY, String(-CAP), '-1']);
}

export async function clearSnapshots() {
  await cmd(['DEL', KEY]);
}
