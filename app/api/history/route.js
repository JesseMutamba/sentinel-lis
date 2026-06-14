// Server-side KPI history — persists snapshots in Vercel KV / Upstash Redis via
// its REST API (no extra npm dependency). If the KV env vars aren't set, every
// method reports { configured: false } and the client falls back to localStorage.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const KEY = 'lumnia:history';
const CAP = 100;

const configured = () => Boolean(KV_URL && KV_TOKEN);

async function kv(command) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`KV ${res.status}`);
  return (await res.json()).result;
}

export async function GET() {
  if (!configured()) return Response.json({ configured: false, snapshots: [] });
  try {
    const raw = await kv(['LRANGE', KEY, '0', '-1']);
    const snapshots = (raw || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
    return Response.json({ configured: true, snapshots });
  } catch (e) {
    return Response.json({ configured: false, error: String(e?.message || e), snapshots: [] });
  }
}

export async function POST(request) {
  if (!configured()) return Response.json({ configured: false });
  try {
    const snap = await request.json();
    await kv(['RPUSH', KEY, JSON.stringify(snap)]);
    await kv(['LTRIM', KEY, String(-CAP), '-1']);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 502 });
  }
}

export async function DELETE() {
  if (!configured()) return Response.json({ configured: false });
  try {
    await kv(['DEL', KEY]);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 502 });
  }
}
