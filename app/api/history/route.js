// KPI history API — server-side persistence via lib/kv. Falls back to
// { configured: false } so the client uses localStorage when KV isn't set up.
import { kvConfigured, getSnapshots, pushSnapshot, clearSnapshots } from '@/lib/kv';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (!kvConfigured()) return Response.json({ configured: false, snapshots: [] });
  try {
    return Response.json({ configured: true, snapshots: await getSnapshots() });
  } catch (e) {
    return Response.json({ configured: false, error: String(e?.message || e), snapshots: [] });
  }
}

export async function POST(request) {
  if (!kvConfigured()) return Response.json({ configured: false });
  try {
    await pushSnapshot(await request.json());
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 502 });
  }
}

export async function DELETE() {
  if (!kvConfigured()) return Response.json({ configured: false });
  try {
    await clearSnapshots();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 502 });
  }
}
