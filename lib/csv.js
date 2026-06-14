// Robust, dependency-free CSV → trips parser.
// Handles messy real-world exports: preamble/footer junk, quoted fields with
// embedded commas, and a wide set of column-name aliases (incl. JDE World Writer).

const COLUMN_ALIASES = {
  id:       ['tripno', 'trip', 'tripid', 'id', 'doco'],
  route:    ['routeflow', 'route', 'corridor', 'flow', 'segmentdescription', 'segment'],
  week:     ['wk', 'week', 'period'],
  delay:    ['delayhrs', 'delay', 'delayhours', 'extradelay'],
  cpt:      ['actual$t', 'actualcostpertonne', 'cpt', 'costpertonne', 'cost'],
  baseline: ['base$t', 'baseline', 'baselinecostpertonne', 'basecost', 'plan$t'],
  tonnes:   ['tonnes', 'tons', 'tonnage', 'weight', 'volume', 'nettonnes'],
  origin:   ['orig', 'origin', 'from', 'source'],
  dest:     ['dest', 'destination', 'to'],
  reason:   ['delayreason', 'reason', 'rootcause'],
  status:   ['tripstatus', 'status'],
};

// Proper CSV line tokenizer (handles "quoted, fields" and "" escapes)
function tokenize(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

const normKey = s => s.toLowerCase().replace(/[^a-z0-9$]/g, '');

function matchColumn(header) {
  const h = normKey(header);
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some(a => normKey(a) === h)) return field;
  }
  return null;
}

// Find the header row: the line whose cells map to enough known columns.
function findHeader(rows) {
  let best = -1, bestScore = 0;
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const fields = new Set(rows[i].map(matchColumn).filter(Boolean));
    let score = 0;
    if (fields.has('week')) score++;
    if (fields.has('tonnes')) score++;
    if (fields.has('delay') || fields.has('cpt')) score++;
    if (fields.has('id') || fields.has('route')) score++;
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return bestScore >= 3 ? best : (rows.length ? 0 : -1);
}

export function parseTripsCSV(text) {
  const errors = [];
  const lines = (text ?? '').split(/\r?\n/).filter(l => l.trim() !== '');
  if (!lines.length) return { trips: [], errors: ['File is empty.'] };

  const rows = lines.map(tokenize);
  const hi = findHeader(rows);
  if (hi < 0) return { trips: [], errors: ['Could not find a header row.'] };

  const colMap = rows[hi].map(matchColumn);
  const present = new Set(colMap.filter(Boolean));
  const required = ['week', 'tonnes'];
  const missing = required.filter(r => !present.has(r));
  if (missing.length || !(present.has('delay') || present.has('cpt'))) {
    errors.push('Missing required columns. Expected at least: route/tripId, week, delay, cpt, tonnes.');
    return { trips: [], errors };
  }

  const trips = [];
  for (let i = hi + 1; i < rows.length; i++) {
    const cells = rows[i];
    const row = {};
    colMap.forEach((field, idx) => { if (field) row[field] = cells[idx]; });

    // Skip footer / junk: a real data row needs a week and some movement fact
    const hasWeek = row.week != null && /\d/.test(String(row.week));
    const hasFact = ['delay', 'cpt', 'tonnes'].some(f => row[f] != null && String(row[f]).trim() !== '');
    const hasIdentity = (row.id && String(row.id).trim()) || (row.route && String(row.route).trim()) || (row.origin && row.dest);
    if (!hasWeek || !hasFact || !hasIdentity) continue;

    if (!row.id) row.id = `ROW-${String(i).padStart(3, '0')}`;
    trips.push(row);
  }

  if (!trips.length) errors.push('No data rows found below the header.');
  return { trips, errors };
}

export const CSV_TEMPLATE = [
  'tripId,route,week,delay,cpt,tonnes',
  'KMO-2026-W01-001,R3,1,0.5,22.10,512',
  'KMO-2026-W02-001,R3,2,0.9,22.30,498',
  'KMO-2026-W06-008,R3,6,,,',
  'KMO-2026-W01-002,R7,1,-0.4,15.05,615',
].join('\n');

// Turn a pasted Google Sheets link into a CSV-export endpoint that reflects
// edits quickly. A normal "Share → copy link" URL works — no Publish-to-web.
export function normalizeSheetUrl(raw) {
  const url = (raw ?? '').trim();
  if (!url) return url;
  if (/output=csv|\/gviz\/|\.csv(\?|$)/i.test(url)) return url;
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (url.includes('docs.google.com/spreadsheets') && idMatch && idMatch[1] !== 'e') {
    const id = idMatch[1];
    const gidMatch = url.match(/[#&?]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=1&gid=${gid}`;
  }
  return url;
}
