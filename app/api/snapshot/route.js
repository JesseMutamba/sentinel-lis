// Server-side KPI snapshot — invoked by Vercel Cron (and callable manually).
// Fetches the configured live source, computes KPIs, and records a snapshot to
// KV when it differs from the last one. Records history even with no browser open.
import { DEFAULT_LIVE_URL } from '@/lib/config';
import { fetchSourceCsv } from '@/lib/fetchSource';
import { parseTripsCSV } from '@/lib/csv';
import { computeFromTrips, snapshotOf, snapSig } from '@/lib/data';
import { kvConfigured, lastSnapshot, pushSnapshot } from '@/lib/kv';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  // When CRON_SECRET is set, Vercel Cron sends it as a Bearer token; require it.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });
  }

  if (!kvConfigured()) return Response.json({ ok: false, configured: false, error: 'KV not configured' }, { status: 503 });
  if (!DEFAULT_LIVE_URL) return Response.json({ ok: false, error: 'No source configured' }, { status: 400 });

  const r = await fetchSourceCsv(DEFAULT_LIVE_URL);
  if (r.text == null) return Response.json({ ok: false, error: r.error }, { status: 502 });

  const { trips, errors } = parseTripsCSV(r.text);
  if (errors.length || !trips.length) return Response.json({ ok: false, error: errors[0] || 'No rows parsed' }, { status: 502 });

  const data = computeFromTrips(trips);
  const snap = snapshotOf(data);

  try {
    const prev = await lastSnapshot();
    if (prev && snapSig(prev) === snapSig(snap)) {
      return Response.json({ ok: true, captured: false, reason: 'unchanged', snapshot: snap });
    }
    await pushSnapshot(snap);
    return Response.json({ ok: true, captured: true, snapshot: snap });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 502 });
  }
}
