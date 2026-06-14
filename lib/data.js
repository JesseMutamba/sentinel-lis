// ─────────────────────────────────────────────────────────────────────────────
// Lumnia corridor engine — segment-based, schema-flexible.
//
// Works on raw CSV rows (from parseTripsCSV) for the bundled sample, uploaded
// files, and live sheets alike. Identity is the physical segment (Origin →
// Destination); baselines, geography and delay reasons are derived from the data.
// ─────────────────────────────────────────────────────────────────────────────

import { parseTripsCSV } from './csv.js';
import { SAMPLE_CSV } from './sampleCsv.js';

export const THRESHOLDS = {
  baselineWeeks: [1, 3],
  rollingWindowWeeks: 3,
  costBlowoutThresholdMultiplier: 1.12,
  delayWarningThresholdHours: 6,
};

// ── value cleaning ───────────────────────────────────────────────────────────
function num(v) {
  if (v == null) return null;
  let s = String(v).trim();
  if (s === '') return null;
  s = s.replace(/[$,]/g, '').replace(/\s*h(rs)?\.?$/i, '').trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function weekNum(v) {
  const m = String(v ?? '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}
function titleCase(s) {
  return String(s ?? '').trim().replace(/\s+/g, ' ')
    .split(' ')
    .map(w => (/^[A-Z0-9]{2,}$/.test(w) ? w[0] + w.slice(1).toLowerCase() : w))
    .join(' ');
}

// ── clean a raw row into a normalized trip ───────────────────────────────────
function cleanTrip(r) {
  const origin = titleCase(r.origin);
  const dest = titleCase(r.dest);
  let segName;
  if (origin && dest) segName = `${origin} → ${dest}`;
  else if (r.route && String(r.route).trim()) segName = String(r.route).trim();
  else segName = 'Unknown segment';

  const week = weekNum(r.week);
  const delay = num(r.delay);
  const cpt = num(r.cpt);
  const tonnes = num(r.tonnes);
  const baseline = num(r.baseline);
  const valid = week != null && delay != null && cpt != null && tonnes != null;

  return {
    id: r.id != null && String(r.id).trim() ? String(r.id).trim() : '(unlabelled)',
    segName, origin, dest, week, delay, cpt, tonnes, baseline,
    reason: String(r.reason ?? '').trim(),
    status: valid ? 'clean' : 'quarantined',
  };
}

const mode = arr => {
  const c = {};
  let best = null, bestN = 0;
  for (const v of arr) { if (!v) continue; c[v] = (c[v] || 0) + 1; if (c[v] > bestN) { bestN = c[v]; best = v; } }
  return best;
};
const median = arr => {
  const a = arr.filter(v => v != null).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};

// ── per-segment analysis ─────────────────────────────────────────────────────
function buildWeeklyAverages(trips) {
  const map = {};
  for (const t of trips) {
    if (t.status !== 'clean') continue;
    const key = `${t.code}-${t.week}`;
    if (!map[key]) map[key] = { code: t.code, week: t.week, delays: [], cpts: [], tonnes: [] };
    map[key].delays.push(t.delay);
    map[key].cpts.push(t.cpt);
    map[key].tonnes.push(t.tonnes);
  }
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  return Object.values(map).map(g => ({
    code: g.code, week: g.week,
    avgDelay: mean(g.delays), avgCPT: mean(g.cpts),
    totalTonnes: g.tonnes.reduce((x, y) => x + y, 0),
  }));
}

function rolling3(rw, week, field) {
  const vals = [week - 2, week - 1, week].map(w => rw.find(d => d.week === w)?.[field]).filter(v => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function analyzeSegment(meta, allWeekly, weeks) {
  const rw = allWeekly.filter(d => d.code === meta.code);
  const baselineCPT = meta.baselineCPT;

  // Each segment is judged against its OWN early-weeks delay baseline, so
  // structurally long hauls don't false-trip the warning — only deterioration does.
  const baseRows = rw.filter(d => weeks.slice(0, 3).includes(d.week));
  const baselineAvgDelay = baseRows.length ? baseRows.reduce((s, d) => s + d.avgDelay, 0) / baseRows.length : 0;
  const delayTrigger = baselineAvgDelay + THRESHOLDS.delayWarningThresholdHours;

  let signalWeek = null, blowoutWeek = null;
  for (const w of weeks) {
    if (!signalWeek) { const rd = rolling3(rw, w, 'avgDelay'); if (rd !== null && rd > delayTrigger) signalWeek = w; }
    if (!blowoutWeek) { const rc = rolling3(rw, w, 'avgCPT'); if (rc !== null && rc > baselineCPT * THRESHOLDS.costBlowoutThresholdMultiplier) blowoutWeek = w; }
  }

  const lastWeeks = weeks.slice(-3);
  const last3 = rw.filter(d => lastWeeks.includes(d.week));
  const latestTonnes = last3.reduce((s, d) => s + d.totalTonnes, 0);
  const latestAvgCPT = last3.length ? last3.reduce((s, d) => s + d.avgCPT, 0) / last3.length : baselineCPT;
  const avoidableCost = Math.max(0, latestTonnes * (latestAvgCPT - baselineCPT));
  const latestRollingDelay = rolling3(rw, weeks[weeks.length - 1], 'avgDelay');
  const currentAvgDelay = latestRollingDelay ?? baselineAvgDelay;
  const drift = currentAvgDelay - baselineAvgDelay;

  let risk = 'normal';
  if (signalWeek && blowoutWeek) risk = 'critical';
  else if (signalWeek || drift > 4) risk = 'watch';

  const weeklyData = weeks.map(w => {
    const wd = rw.find(d => d.week === w);
    return {
      week: w, label: `W${w}`,
      avgDelay: wd?.avgDelay ?? null, avgCPT: wd?.avgCPT ?? null, totalTonnes: wd?.totalTonnes ?? null,
      rollingDelay: rolling3(rw, w, 'avgDelay'), rollingCPT: rolling3(rw, w, 'avgCPT'),
    };
  });

  return {
    routeId: meta.code, code: meta.code,
    origin: meta.origin, dest: meta.dest, segment: meta.segment,
    baselineCPT, baselineTransit: 0,
    signalWeek, blowoutWeek, costBlowoutWeek: blowoutWeek,
    avoidableCost, latestRollingDelay, latestAvgCPT,
    actualCostPerTonne: latestAvgCPT, baselineCostPerTonne: baselineCPT,
    baselineAvgDelayHours: baselineAvgDelay, currentAvgDelayHours: currentAvgDelay,
    delayDriftHours: currentAvgDelay - baselineAvgDelay,
    leadTimeWeeks: signalWeek && blowoutWeek ? blowoutWeek - signalWeek : null,
    topDelayReason: meta.topDelayReason,
    latestTonnes, drift, risk, weeklyData,
  };
}

// ── top-level compute ────────────────────────────────────────────────────────
export function computeFromTrips(rawRows) {
  const incoming = rawRows ?? [];

  // Control layer: drop duplicate ids (keep first)
  const seen = new Set();
  let duplicatesDropped = 0;
  const deduped = [];
  for (const r of incoming) {
    const id = r.id != null ? String(r.id).trim() : '';
    if (id && id !== '(unlabelled)' && seen.has(id)) { duplicatesDropped++; continue; }
    if (id) seen.add(id);
    deduped.push(r);
  }

  const cleaned = deduped.map(cleanTrip);

  // Assign a short code per unique segment (keep Rn/Sn-style ids if present)
  const codeBySeg = {};
  let nextCode = 1;
  for (const t of cleaned) {
    if (codeBySeg[t.segName]) continue;
    codeBySeg[t.segName] = /^[A-Z]{1,2}\d+$/.test(t.segName) ? t.segName : `S${nextCode++}`;
  }
  for (const t of cleaned) t.code = codeBySeg[t.segName];

  const weekNums = cleaned.map(t => t.week).filter(w => w != null);
  const minWeek = weekNums.length ? Math.min(...weekNums) : 1;
  const maxWeek = weekNums.length ? Math.max(...weekNums) : 12;
  const weeks = [];
  for (let w = minWeek; w <= maxWeek; w++) weeks.push(w);

  const allWeekly = buildWeeklyAverages(cleaned);

  // Build meta per segment (geography + baseline + dominant delay reason)
  const segOrder = [...new Set(cleaned.map(t => t.segName))];
  const metas = segOrder.map(segName => {
    const group = cleaned.filter(t => t.segName === segName);
    const clean = group.filter(t => t.status === 'clean');
    const code = codeBySeg[segName];
    const origin = group[0].origin || segName;
    const dest = group[0].dest || '';
    const baselineFromData = median(clean.map(t => t.baseline));
    const baselineCPT = baselineFromData != null ? baselineFromData
      : (median(clean.map(t => t.cpt)) ?? 0);
    const topDelayReason = mode(clean.filter(t => (t.week ?? 0) >= maxWeek - 3).map(t => t.reason))
      || mode(clean.map(t => t.reason)) || 'Operational congestion';
    return { code, segName, segment: segName, origin, dest, baselineCPT, topDelayReason };
  });

  const routeAnalyses = {};
  for (const meta of metas) routeAnalyses[meta.code] = analyzeSegment(meta, allWeekly, weeks);

  const ras = Object.values(routeAnalyses);
  const tripsClean = cleaned.filter(t => t.status === 'clean').length;
  const tripsQuarantined = cleaned.length - tripsClean;
  const avoidableCost = ras.reduce((s, r) => s + r.avoidableCost, 0);

  const flagged = ras.filter(r => r.risk !== 'normal');
  const hero = [...(flagged.length ? flagged : ras)]
    .sort((a, b) => (a.risk === 'critical' ? -1 : b.risk === 'critical' ? 1 : 0) || b.avoidableCost - a.avoidableCost)[0] || null;

  return {
    trips: cleaned, routeAnalyses, allWeekly, weeks, minWeek, maxWeek,
    heroId: hero?.routeId ?? ras[0]?.routeId, thresholds: THRESHOLDS,
    integrity: {
      rawRows: incoming.length, duplicatesDropped,
      cleanTrips: tripsClean, rowsNeedingReview: tripsQuarantined,
      routeCount: ras.length, segmentCount: ras.length,
    },
    summary: {
      totalAvoidableCost: avoidableCost,
      totalTonnes: ras.reduce((s, r) => s + r.latestTonnes, 0),
      flaggedSegments: flagged.length,
      criticalSegments: ras.filter(r => r.risk === 'critical').length,
    },
    kpis: { tripsIngested: cleaned.length, tripsClean, tripsQuarantined, avoidableCost },
  };
}

// Bundled sample = the messy Kamoa export, parsed through the same pipeline.
export function sampleRows() {
  return parseTripsCSV(SAMPLE_CSV).trips;
}

let _cache = null;
export function getSentinelData() {
  if (!_cache) _cache = computeFromTrips(sampleRows());
  return _cache;
}

// ── Period-aware metrics (Week / Month / Quarter) ────────────────────────────
function windowFor(period, weeks) {
  const max = weeks[weeks.length - 1];
  if (period === 'week') return { weeks: [max], prior: weeks.includes(max - 1) ? [max - 1] : null, label: 'Latest week' };
  if (period === 'quarter') return { weeks: [...weeks], prior: null, label: `Full ${weeks.length}-week survey` };
  const cur = weeks.slice(-4);
  const prior = weeks.slice(-8, -4);
  return { weeks: cur, prior: prior.length ? prior : null, label: `Latest ${cur.length} weeks` };
}
function aggregateRoute(weeklyData, weeks) {
  let tonnes = 0, cptSum = 0, cptN = 0, delaySum = 0, delayN = 0;
  for (const w of weeks) {
    const d = weeklyData.find(x => x.week === w);
    if (!d) continue;
    if (d.totalTonnes != null) tonnes += d.totalTonnes;
    if (d.avgCPT != null) { cptSum += d.avgCPT; cptN++; }
    if (d.avgDelay != null) { delaySum += d.avgDelay; delayN++; }
  }
  return { tonnes, avgCPT: cptN ? cptSum / cptN : null, avgDelay: delayN ? delaySum / delayN : null };
}
function networkForWindow(routeAnalyses, weeks) {
  let avoidable = 0, tonnes = 0, hot = 0;
  const routeTonnes = {};
  for (const id of Object.keys(routeAnalyses)) {
    const ra = routeAnalyses[id];
    const agg = aggregateRoute(ra.weeklyData, weeks);
    routeTonnes[id] = agg.tonnes;
    tonnes += agg.tonnes;
    if (agg.avgCPT != null) avoidable += Math.max(0, agg.tonnes * (agg.avgCPT - ra.baselineCPT));
    const isHot = (agg.avgDelay != null && agg.avgDelay > 4) || (agg.avgCPT != null && agg.avgCPT > ra.baselineCPT * 1.12);
    if (isHot) hot++;
  }
  return { avoidable, tonnes, hot, routeTonnes };
}
function pctTrend(cur, prior) {
  if (prior == null || prior === 0) return null;
  return ((cur - prior) / prior) * 100;
}
export function computePeriodMetrics(data, period) {
  const win = windowFor(period, data.weeks);
  const cur = networkForWindow(data.routeAnalyses, win.weeks);
  const prior = win.prior ? networkForWindow(data.routeAnalyses, win.prior) : null;
  const tripCount = data.trips.filter(t => win.weeks.includes(t.week) && t.status === 'clean').length;
  return {
    period, routeTonnes: cur.routeTonnes,
    kpis: {
      avoidableCost: cur.avoidable, networkTonnes: cur.tonnes, hotSegments: data.summary.flaggedSegments, inTransit: tripCount,
      routeCount: Object.keys(data.routeAnalyses).length, tripCount,
      avoidableTrend: prior ? pctTrend(cur.avoidable, prior.avoidable) : null,
      tonnesTrend: prior ? pctTrend(cur.tonnes, prior.tonnes) : null,
      periodLabel: win.label,
    },
  };
}

// ── "Explain every number" ───────────────────────────────────────────────────
const money = n => `$${Math.round(n).toLocaleString()}`;
const tonnesFmt = n => `${Math.round(n).toLocaleString()} t`;

export function buildExplanations(data, metrics) {
  const ras = Object.values(data.routeAnalyses);
  const m = metrics.kpis;

  const leakers = ras.filter(r => r.avoidableCost > 0).sort((a, b) => b.avoidableCost - a.avoidableCost);
  const totalLeak = leakers.reduce((s, r) => s + r.avoidableCost, 0) || 1;
  const avoidableCost = leakers.length
    ? leakers.slice(0, 3).map(r => {
        const share = Math.round((r.avoidableCost / totalLeak) * 100);
        const over = ((r.latestAvgCPT - r.baselineCPT) / r.baselineCPT) * 100;
        return `${r.segment}: ${money(r.avoidableCost)} (${share}% of leak) — $${r.latestAvgCPT.toFixed(0)}/t vs $${r.baselineCPT}/t baseline, +${over.toFixed(0)}%${r.blowoutWeek ? `, blowout W${r.blowoutWeek}` : ''}.`;
      })
    : ['No segment is running above its cost baseline in the latest window — zero avoidable cost.'];

  const byTonnes = ras.map(r => ({ r, t: metrics.routeTonnes[r.routeId] ?? 0 })).sort((a, b) => b.t - a.t).filter(x => x.t > 0);
  const networkTonnes = byTonnes.length
    ? [
        `${tonnesFmt(m.networkTonnes)} across ${m.routeCount} segments in ${m.periodLabel.toLowerCase()}.`,
        ...byTonnes.slice(0, 2).map(x => `${x.r.segment} carries ${tonnesFmt(x.t)} (${Math.round((x.t / m.networkTonnes) * 100)}%).`),
      ]
    : ['No clean tonnage recorded in this window.'];

  const hot = ras.filter(r => r.risk !== 'normal').sort((a, b) => (a.risk === 'critical' ? -1 : 1));
  const hotSegments = hot.length
    ? hot.slice(0, 4).map(r => r.risk === 'critical'
        ? `${r.segment}: CRITICAL — signal W${r.signalWeek} + blowout W${r.blowoutWeek}; ${money(r.avoidableCost)} avoidable.`
        : `${r.segment}: WATCH — ${r.signalWeek ? `signal W${r.signalWeek}` : `drift +${r.drift.toFixed(1)}h`}; no blowout yet.`)
    : ['Every segment is within delay and cost baselines.'];

  const inTransit = [
    `${m.inTransit} clean trips moved in ${m.periodLabel.toLowerCase()}.`,
    `${data.kpis.tripsIngested} rows ingested · ${data.kpis.tripsClean} clean · ${data.kpis.tripsQuarantined} quarantined and excluded.`,
  ];

  const hero = data.routeAnalyses[data.heroId];
  const leadTime = hero && hero.leadTimeWeeks != null
    ? [
        `${hero.segment}: ${hero.leadTimeWeeks}-week runway — delay signal W${hero.signalWeek} preceded cost blowout W${hero.blowoutWeek}.`,
        `Lead time is the window to act before cost escalates; longer = more warning.`,
      ]
    : ['No segment has both a delay signal and a later cost blowout, so there is no measurable lead time yet.'];

  return { avoidableCost, networkTonnes, hotSegments, inTransit, leadTime };
}
