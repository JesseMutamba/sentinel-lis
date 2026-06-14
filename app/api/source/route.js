// Server-side CSV proxy — fetches a sheet/CSV source server-to-server so the
// browser never hits CORS. Host-allowlisted to avoid being an open proxy.
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

function allowed(host) {
  return ALLOWED_HOSTS.some(rx => rx.test(host));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');

  if (!target) {
    return new Response('Missing url parameter', { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }

  if (parsed.protocol !== 'https:') {
    return new Response('Only https sources are allowed', { status: 400 });
  }
  if (!allowed(parsed.host)) {
    return new Response(`Host not allowed: ${parsed.host}`, { status: 400 });
  }

  try {
    const res = await fetch(parsed.toString(), {
      cache: 'no-store',
      redirect: 'follow',
      headers: { 'User-Agent': 'Lumnia-Corridor/1.0', Accept: 'text/csv,*/*' },
    });
    if (!res.ok) {
      return new Response(`Upstream responded ${res.status}`, { status: 502 });
    }
    const text = await res.text();
    // A login/HTML page means the sheet isn't shared publicly
    if (/^\s*<(!doctype|html)/i.test(text)) {
      return new Response('Source returned HTML, not CSV — make sure the sheet is shared "Anyone with the link".', { status: 422 });
    }
    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return new Response(`Fetch failed: ${e?.message || e}`, { status: 502 });
  }
}
