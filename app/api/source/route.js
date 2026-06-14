// Server-side CSV proxy — fetches a sheet/CSV source server-to-server (no CORS).
// For Google Sheets links it tries several public CSV endpoints so whichever the
// sheet exposes (gviz / export) works. Host-allowlisted to avoid an open proxy.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_HOSTS = [
  /(^|\.)docs\.google\.com$/,
  /(^|\.)drive\.google\.com$/,
  /(^|\.)googleusercontent\.com$/,
  /(^|\.)sharepoint\.com$/,
  /(^|\.)onedrive\.live\.com$/,
  /(^|\.)1drv\.ms$/,
  /(^|\.)live\.com$/,
  /(^|\.)officeapps\.live\.com$/,
];
const allowed = host => ALLOWED_HOSTS.some(rx => rx.test(host));
const UA = 'Mozilla/5.0 (compatible; Lumnia-Corridor/1.0; +https://lumnia.demo)';

// Expand a Google Sheets link into ordered CSV-export candidates.
// /export is tried first: it returns the raw sheet with headers intact. (The
// gviz endpoint mangles messy sheets — it blanks numeric column headers — so it
// is only a fallback.)
function candidates(target) {
  if (/output=csv|\/gviz\/|\.csv(\?|$)/i.test(target)) return [target];
  const m = target.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (target.includes('docs.google.com/spreadsheets') && m && m[1] !== 'e') {
    const id = m[1];
    const g = target.match(/[#&?]gid=(\d+)/);
    const gid = g ? g[1] : '0';
    return [
      `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`,
      `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`,
    ];
  }
  return [target];
}

async function tryFetch(u) {
  let parsed;
  try { parsed = new URL(u); } catch { return { error: 'Invalid url' }; }
  if (parsed.protocol !== 'https:') return { error: 'Only https sources are allowed' };
  if (!allowed(parsed.host)) return { error: `Host not allowed: ${parsed.host}` };
  try {
    const res = await fetch(parsed.toString(), {
      cache: 'no-store', redirect: 'follow',
      headers: { 'User-Agent': UA, Accept: 'text/csv,text/plain,*/*' },
    });
    if (!res.ok) return { error: `HTTP ${res.status}`, status: res.status };
    const text = await res.text();
    if (/^\s*<(!doctype|html)/i.test(text)) return { error: 'returned HTML, not CSV' };
    return { text };
  } catch (e) {
    return { error: e?.message || String(e) };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  if (!target) return new Response('Missing url parameter', { status: 400 });

  let last = { error: 'No candidates' };
  for (const c of candidates(target)) {
    const r = await tryFetch(c);
    if (r.text != null) {
      return new Response(r.text, {
        status: 200,
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    last = r;
  }

  const hint = last.status === 403 || last.status === 401
    ? ' — the sheet must be shared "Anyone with the link → Viewer" (not restricted to an organization).'
    : '';
  return new Response(`Could not read source: ${last.error}${hint}`, { status: 502 });
}
