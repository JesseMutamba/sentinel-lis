// Fetches a sheet/CSV source server-to-server (no CORS). For Google Sheets links
// it tries /export first (headers intact), then gviz, with a cache-buster so
// edits propagate fast. Host-allowlisted to avoid an open proxy.
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

function candidates(target) {
  if (/output=csv|\/gviz\/|\.csv(\?|$)/i.test(target)) return [target];
  const m = target.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (target.includes('docs.google.com/spreadsheets') && m && m[1] !== 'e') {
    const id = m[1];
    const g = target.match(/[#&?]gid=(\d+)/);
    const gid = g ? g[1] : '0';
    const cb = Date.now();
    return [
      `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}&_cb=${cb}`,
      `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}&_cb=${cb}`,
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

export async function fetchSourceCsv(rawUrl) {
  let last = { error: 'No candidates' };
  for (const c of candidates(rawUrl)) {
    const r = await tryFetch(c);
    if (r.text != null) return r;
    last = r;
  }
  return last;
}
