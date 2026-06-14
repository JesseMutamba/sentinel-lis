// ─────────────────────────────────────────────────────────────────────────────
// Lumnia corridor engine
//
// All analytics are computed from a *trips* dataset, so the dashboard can be
// driven by the built-in sample OR by data the user uploads / connects. Swap the
// trips, call computeFromTrips(), and every KPI, risk state, brief and chart
// re-derives from the new numbers.
// ─────────────────────────────────────────────────────────────────────────────

// Linear Congruential Generator — deterministic, seeded per trip
function lcg(seed) {
  const a = 1664525;
  const c = 1013904223;
  let s = seed >>> 0;
  return {
    next() {
      s = (Math.imul(a, s) + c) >>> 0;
      return s / 4294967296;
    },
  };
}

// Canonical corridor metadata (baselines + geography). Uploaded trips reference
// these route ids; unknown routes get a baseline synthesised from their data.
export const ROUTES = {
  R1: { id: 'R1', origin: 'Lusaka', dest: 'Chirundu', baselineCPT: 18, baselineTransit: 8, tonnes: 420 },
  R2: { id: 'R2', origin: 'Chirundu', dest: 'Harare', baselineCPT: 20, baselineTransit: 9, tonnes: 380 },
  R3: { id: 'R3', origin: 'Kasumbalesa', dest: 'Copperbelt Border', baselineCPT: 22, baselineTransit: 10, tonnes: 510 },
  R4: { id: 'R4', origin: 'Beira', dest: 'Blantyre', baselineCPT: 25, baselineTransit: 12, tonnes: 290 },
  R5: { id: 'R5', origin: 'Dar es Salaam', dest: 'Lusaka', baselineCPT: 30, baselineTransit: 15, tonnes: 340 },
  R6: { id: 'R6', origin: 'Nacala', dest: 'Lilongwe', baselineCPT: 28, baselineTransit: 13, tonnes: 310 },
  R7: { id: 'R7', origin: 'Durban', dest: 'Johannesburg', baselineCPT: 15, baselineTransit: 6, tonnes: 620 },
};

const ROUTE_IDS = Object.keys(ROUTES);

// ── Sample dataset generation ────────────────────────────────────────────────
const R3_DELAYS = [0.5, 0.8, 1.2, 3.5, 5.2, 8.1, 11.4, 14.2, 16.8, 18.3, 17.9, 18.1];
const R3_COST_MULT = [1.00, 1.01, 1.02, 1.04, 1.07, 1.09, 1.11, 1.12, 1.14, 1.16, 1.15, 1.16];
const R5_DELAY_BIAS = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 4.8, 5.0, 5.2];
const QUARANTINED_ID = 'KMO-2026-W06-008';

export function generateTrips() {
  const trips = [];
  for (let w = 1; w <= 12; w++) {
    for (let ri = 0; ri < 7; ri++) {
      for (let t = 1; t <= 2; t++) {
        const routeId = ROUTE_IDS[ri];
        const route = ROUTES[routeId];
        const numInWeek = ri * 2 + t;
        const tripId = `KMO-2026-W${String(w).padStart(2, '0')}-${String(numInWeek).padStart(3, '0')}`;

        if (tripId === QUARANTINED_ID) {
          trips.push({ id: tripId, route: routeId, week: w, delay: null, cpt: null, tonnes: null });
          continue;
        }

        const seed = ri * 10000 + w * 100 + t;
        const rng = lcg(seed);
        const j1 = (rng.next() - 0.5) * 0.6;
        const j2 = (rng.next() - 0.5) * 0.03;
        const j3 = (rng.next() - 0.5) * 0.08;

        let delay, cpt;
        if (routeId === 'R3') {
          delay = R3_DELAYS[w - 1] + j1 * 0.5;
          cpt = route.baselineCPT * R3_COST_MULT[w - 1] * (1 + j2);
        } else if (routeId === 'R5') {
          delay = Math.max(0, R5_DELAY_BIAS[w - 1] + j1 * 1.2);
          cpt = route.baselineCPT * (1 + j2 + 0.015 * (w / 12));
        } else {
          delay = Math.max(-1.5, (rng.next() - 0.65) * 2.8 + j1 * 0.4);
          cpt = route.baselineCPT * (1 + j2);
        }

        trips.push({
          id: tripId, route: routeId, week: w,
          delay: +delay.toFixed(2), cpt: +cpt.toFixed(2),
          tonnes: Math.round(route.tonnes * (1 + j3)),
        });
      }
    }
  }
  return trips;
}

// ── Trip validation ──────────────────────────────────────────────────────────
function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function classifyTrip(t) {
  const route = t.route != null && String(t.route).trim() !== '' ? String(t.route).trim() : null;
  const week = num(t.week);
  const delay = num(t.delay);
  const cpt = num(t.cpt);
  const tonnes = num(t.tonnes);
  const valid = route && week != null && delay != null && cpt != null && tonnes != null;
  return {
    id: t.id != null && String(t.id).trim() !== '' ? String(t.id).trim() : '(unlabelled)',
    route, week: week != null ? Math.round(week) : null,
    delay, cpt, tonnes,
    status: valid ? 'clean' : 'quarantined',
  };
}

// ── Per-route analysis ───────────────────────────────────────────────────────
function buildWeeklyAverages(trips) {
  const map = {};
  for (const trip of trips) {
    if (trip.status !== 'clean') continue;
    const key = `${trip.route}-${trip.week}`;
    if (!map[key]) map[key] = { route: trip.route, week: trip.week, delays: [], cpts: [], tonnes: [] };
    map[key].delays.push(trip.delay);
    map[key].cpts.push(trip.cpt);
    map[key].tonnes.push(trip.tonnes);
  }
  const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  return Object.values(map).map(g => ({
    route: g.route, week: g.week,
    avgDelay: mean(g.delays), avgCPT: mean(g.cpts),
    totalTonnes: g.tonnes.reduce((a, b) => a + b, 0),
  }));
}

function rolling3(rw, week, field) {
  const vals = [week - 2, week - 1, week]
    .map(w => rw.find(d => d.week === w)?.[field])
    .filter(v => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function resolveMeta(routeId, rw) {
  if (ROUTES[routeId]) return ROUTES[routeId];
  // Unknown route → synthesise a baseline from its earliest clean weeks
  const early = [...rw].sort((a, b) => a.week - b.week).slice(0, 3);
  const baselineCPT = early.length ? early.reduce((s, d) => s + d.avgCPT, 0) / early.length : 0;
  return { id: routeId, origin: routeId, dest: '—', baselineCPT: +baselineCPT.toFixed(2), baselineTransit: 0, tonnes: 0 };
}

function analyzeRoute(routeId, allWeekly, weeks) {
  const rw = allWeekly.filter(d => d.route === routeId);
  const meta = resolveMeta(routeId, rw);

  let signalWeek = null, blowoutWeek = null;
  for (const w of weeks) {
    if (!signalWeek) {
      const rd = rolling3(rw, w, 'avgDelay');
      if (rd !== null && rd > 6) signalWeek = w;
    }
    if (!blowoutWeek) {
      const rc = rolling3(rw, w, 'avgCPT');
      if (rc !== null && rc > meta.baselineCPT * 1.12) blowoutWeek = w;
    }
  }

  const lastWeeks = weeks.slice(-3);
  const last3 = rw.filter(d => lastWeeks.includes(d.week));
  const latestTonnes = last3.reduce((s, d) => s + d.totalTonnes, 0);
  const latestAvgCPT = last3.length ? last3.reduce((s, d) => s + d.avgCPT, 0) / last3.length : meta.baselineCPT;
  const avoidableCost = Math.max(0, latestTonnes * (latestAvgCPT - meta.baselineCPT));
  const latestRollingDelay = rolling3(rw, weeks[weeks.length - 1], 'avgDelay');
  const drift = latestRollingDelay ?? 0;

  let risk = 'normal';
  if (signalWeek && blowoutWeek) risk = 'critical';
  else if (signalWeek || drift > 4) risk = 'watch';

  const weeklyData = weeks.map(w => {
    const wd = rw.find(d => d.week === w);
    return {
      week: w, label: `W${w}`,
      avgDelay: wd?.avgDelay ?? null,
      avgCPT: wd?.avgCPT ?? null,
      totalTonnes: wd?.totalTonnes ?? null,
      rollingDelay: rolling3(rw, w, 'avgDelay'),
      rollingCPT: rolling3(rw, w, 'avgCPT'),
    };
  });

  return {
    routeId, origin: meta.origin, dest: meta.dest,
    baselineCPT: meta.baselineCPT, baselineTransit: meta.baselineTransit,
    signalWeek, blowoutWeek, avoidableCost, latestRollingDelay, latestAvgCPT,
    drift, risk, weeklyData,
  };
}

// ── Top-level: compute everything from a trips array ─────────────────────────
export function computeFromTrips(rawTrips) {
  const trips = (rawTrips ?? []).map(classifyTrip);

  const weekNums = trips.map(t => t.week).filter(w => w != null);
  const minWeek = weekNums.length ? Math.min(...weekNums) : 1;
  const maxWeek = weekNums.length ? Math.max(...weekNums) : 12;
  const weeks = [];
  for (let w = minWeek; w <= maxWeek; w++) weeks.push(w);

  const allWeekly = buildWeeklyAverages(trips);

  // Route order: canonical first, then any extra routes seen in the data
  const seen = [...new Set(trips.map(t => t.route).filter(Boolean))];
  const orderedIds = [
    ...ROUTE_IDS.filter(id => seen.includes(id)),
    ...seen.filter(id => !ROUTE_IDS.includes(id)),
  ];
  // Sample dataset (and uploads covering all routes) keep the full R1–R7 set
  const routeIds = orderedIds.length ? orderedIds : ROUTE_IDS;

  const routeAnalyses = {};
  for (const id of routeIds) routeAnalyses[id] = analyzeRoute(id, allWeekly, weeks);

  const tripsClean = trips.filter(t => t.status === 'clean').length;
  const tripsQuarantined = trips.length - tripsClean;
  const avoidableCost = Object.values(routeAnalyses).reduce((s, r) => s + r.avoidableCost, 0);

  return {
    trips, routeAnalyses, allWeekly, weeks, minWeek, maxWeek,
    kpis: { tripsIngested: trips.length, tripsClean, tripsQuarantined, avoidableCost },
  };
}

let _cache = null;
export function getSentinelData() {
  if (!_cache) _cache = computeFromTrips(generateTrips());
  return _cache;
}

// ── Period-aware metrics (Week / Month / Quarter) ────────────────────────────
function windowFor(period, weeks) {
  const max = weeks[weeks.length - 1];
  if (period === 'week') {
    return { weeks: [max], prior: weeks.includes(max - 1) ? [max - 1] : null, label: 'Latest week' };
  }
  if (period === 'quarter') {
    return { weeks: [...weeks], prior: null, label: `Full ${weeks.length}-week survey` };
  }
  // month — last up to 4 weeks, prior = the 4 before
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
    period,
    routeTonnes: cur.routeTonnes,
    kpis: {
      avoidableCost: cur.avoidable,
      networkTonnes: cur.tonnes,
      hotSegments: cur.hot,
      inTransit: tripCount,
      routeCount: Object.keys(data.routeAnalyses).length,
      tripCount,
      avoidableTrend: prior ? pctTrend(cur.avoidable, prior.avoidable) : null,
      tonnesTrend: prior ? pctTrend(cur.tonnes, prior.tonnes) : null,
      periodLabel: win.label,
    },
  };
}

// ── "Explain every number" — data-driven driver stories per KPI ──────────────
const money = n => `$${Math.round(n).toLocaleString()}`;
const tonnes = n => `${Math.round(n).toLocaleString()} t`;

export function buildExplanations(data, metrics) {
  const ras = Object.values(data.routeAnalyses);
  const m = metrics.kpis;

  // Avoidable cost — which routes leak, and why
  const leakers = ras.filter(r => r.avoidableCost > 0).sort((a, b) => b.avoidableCost - a.avoidableCost);
  const totalLeak = leakers.reduce((s, r) => s + r.avoidableCost, 0) || 1;
  const avoidable = leakers.length
    ? leakers.slice(0, 3).map(r => {
        const share = Math.round((r.avoidableCost / totalLeak) * 100);
        const over = ((r.latestAvgCPT - r.baselineCPT) / r.baselineCPT) * 100;
        return `${r.routeId} ${r.origin} → ${r.dest}: ${money(r.avoidableCost)} (${share}% of leak) — running $${r.latestAvgCPT.toFixed(0)}/t vs $${r.baselineCPT}/t baseline, +${over.toFixed(0)}%${r.blowoutWeek ? `, blowout confirmed W${r.blowoutWeek}` : ''}.`;
      })
    : ['No route is running above its cost baseline in the latest window — zero avoidable cost.'];

  // Network tonnes — where the volume is
  const byTonnes = [...ras].map(r => ({ r, t: metrics.routeTonnes[r.routeId] ?? 0 }))
    .sort((a, b) => b.t - a.t).filter(x => x.t > 0);
  const networkTonnes = byTonnes.length
    ? [
        `${tonnes(m.networkTonnes)} moved across ${m.routeCount} routes in ${m.periodLabel.toLowerCase()}.`,
        ...byTonnes.slice(0, 2).map(x => `${x.r.routeId} ${x.r.origin} → ${x.r.dest} carries ${tonnes(x.t)} (${Math.round((x.t / m.networkTonnes) * 100)}%).`),
      ]
    : ['No clean tonnage recorded in this window.'];

  // Hot segments — what makes each one hot
  const hot = ras.filter(r => r.risk !== 'normal').sort((a, b) => (a.risk === 'critical' ? -1 : 1));
  const hotSegments = hot.length
    ? hot.map(r => {
        if (r.risk === 'critical') {
          return `${r.routeId} CRITICAL — delay signal W${r.signalWeek} + cost blowout W${r.blowoutWeek}; ${money(r.avoidableCost)} avoidable.`;
        }
        return `${r.routeId} WATCH — ${r.signalWeek ? `delay signal W${r.signalWeek}` : `transit drift +${r.drift.toFixed(1)}h over baseline`}; no cost blowout yet.`;
      })
    : ['Every route is within delay and cost baselines — no hot segments.'];

  // In transit — clean vs quarantined
  const inTransit = [
    `${m.inTransit} clean trips moved in ${m.periodLabel.toLowerCase()}.`,
    `${data.kpis.tripsIngested} trips ingested overall · ${data.kpis.tripsClean} clean · ${data.kpis.tripsQuarantined} quarantined (missing delay/cost/tonnes) and excluded from the maths.`,
  ];

  return { avoidableCost: avoidable, networkTonnes, hotSegments, inTransit };
}
