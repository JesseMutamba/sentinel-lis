// Lightweight CSV <-> trips helpers (client-side, no dependencies).
// Expected columns (header, case-insensitive, order-independent):
//   tripId, route, week, delay, cpt, tonnes

const COLUMN_ALIASES = {
  id: ['tripid', 'trip_id', 'trip', 'id'],
  route: ['route', 'routeid', 'route_id', 'leg', 'corridor'],
  week: ['week', 'wk', 'period'],
  delay: ['delay', 'delayhrs', 'delay_hrs', 'extradelay', 'delayhours'],
  cpt: ['cpt', 'costpertonne', 'cost_per_tonne', 'cost', '$/t', 'costpert'],
  tonnes: ['tonnes', 'tons', 'tonnage', 'weight', 'volume'],
};

function splitLine(line) {
  // simple split; values in this dataset have no embedded commas
  return line.split(',').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
}

function matchColumn(header) {
  const h = header.toLowerCase().replace(/[\s_]/g, '');
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some(a => a.replace(/[\s_]/g, '') === h)) return field;
  }
  return null;
}

export function parseTripsCSV(text) {
  const errors = [];
  const lines = (text ?? '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { trips: [], errors: ['File is empty.'] };

  const headerCells = splitLine(lines[0]);
  const colMap = headerCells.map(matchColumn);

  const required = ['route', 'week', 'delay', 'cpt', 'tonnes'];
  const present = new Set(colMap.filter(Boolean));
  const missing = required.filter(r => !present.has(r));
  if (missing.length) {
    errors.push(`Missing required column(s): ${missing.join(', ')}. Expected: tripId, route, week, delay, cpt, tonnes.`);
    return { trips: [], errors };
  }

  const trips = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const row = {};
    colMap.forEach((field, idx) => { if (field) row[field] = cells[idx]; });
    if (!row.id) row.id = `ROW-${String(i).padStart(3, '0')}`;
    trips.push(row);
  }

  if (trips.length === 0) errors.push('No data rows found below the header.');
  return { trips, errors };
}

export function tripsToCSV(trips) {
  const header = 'tripId,route,week,delay,cpt,tonnes';
  const rows = trips.map(t => [
    t.id, t.route, t.week,
    t.delay ?? '', t.cpt ?? '', t.tonnes ?? '',
  ].join(','));
  return [header, ...rows].join('\n');
}

// A small, valid starter file. The W06 row has blank delay/cpt/tonnes on
// purpose — it demonstrates how incomplete records get quarantined on ingest.
export const CSV_TEMPLATE = [
  'tripId,route,week,delay,cpt,tonnes',
  'KMO-2026-W01-001,R3,1,0.5,22.10,512',
  'KMO-2026-W02-001,R3,2,0.9,22.30,498',
  'KMO-2026-W06-008,R3,6,,,',
  'KMO-2026-W01-002,R7,1,-0.4,15.05,615',
].join('\n');

// Turn a pasted Google Sheets link into a CSV-export endpoint that reflects
// edits quickly. A normal "Share → copy link" URL works — no Publish-to-web.
//   .../spreadsheets/d/<ID>/edit#gid=<GID>  →  gviz CSV export
// Links that are already CSV (pub?output=csv, /gviz/, *.csv) pass through.
export function normalizeSheetUrl(raw) {
  const url = (raw ?? '').trim();
  if (!url) return url;

  const alreadyCsv = /output=csv|\/gviz\/|\.csv(\?|$)/i.test(url);
  if (alreadyCsv) return url;

  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (url.includes('docs.google.com/spreadsheets') && idMatch && idMatch[1] !== 'e') {
    const id = idMatch[1];
    const gidMatch = url.match(/[#&?]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=1&gid=${gid}`;
  }
  return url;
}

