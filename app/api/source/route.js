// Same-origin CSV proxy (no CORS) — delegates fetching to lib/fetchSource.
import { fetchSourceCsv } from '@/lib/fetchSource';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  if (!target) return new Response('Missing url parameter', { status: 400 });

  const r = await fetchSourceCsv(target);
  if (r.text != null) {
    return new Response(r.text, {
      status: 200,
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  const hint = r.status === 403 || r.status === 401
    ? ' — the sheet must be shared "Anyone with the link → Viewer" (not restricted to an organization).'
    : '';
  return new Response(`Could not read source: ${r.error}${hint}`, { status: 502 });
}
