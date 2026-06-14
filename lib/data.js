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

export const ROUTES = {
  R1: { id: 'R1', origin: 'Lusaka', dest: 'Chirundu', baselineCPT: 18, baselineTransit: 8, tonnes: 420 },
  R2: { id: 'R2', origin: 'Chirundu', dest: 'Harare', baselineCPT: 20, baselineTransit: 9, tonnes: 380 },
  R3: { id: 'R3', origin: 'Kasumbalesa', dest: 'Copperbelt Border', baselineCPT: 22, baselineTransit: 10, tonnes: 510 },
  R4: { id: 'R4', origin: 'Beira', dest: 'Blantyre', baselineCPT: 25, baselineTransit: 12, tonnes: 290 },
  R5: { id: 'R5', origin: 'Dar es Salaam', dest: 'Lusaka', baselineCPT: 30, baselineTransit: 15, tonnes: 340 },
  R6: { id: 'R6', origin: 'Nacala', dest: 'Lilongwe', baselineCPT: 28, baselineTransit: 13, tonnes: 310 },
  R7: { id: 'R7', origin: 'Durban', dest: 'Johannesburg', baselineCPT: 15, baselineTransit: 6, tonnes: 620 },
};

// R3 scripted delay profile (extra hours above baseline per week)
const R3_DELAYS = [0.5, 0.8, 1.2, 3.5, 5.2, 8.1, 11.4, 14.2, 16.8, 18.3, 17.9, 18.1];
const R3_COST_MULT = [1.00, 1.01, 1.02, 1.04, 1.07, 1.09, 1.11, 1.12, 1.14, 1.16, 1.15, 1.16];

// R5 elevated delay profile (watch route)
const R5_DELAY_BIAS = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 4.8, 5.0, 5.2];

const QUARANTINED_ID = 'KMO-2026-W06-008';
const ROUTE_IDS = Object.keys(ROUTES);

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
          trips.push({ id: tripId, route: routeId, week: w, delay: null, cpt: null, tonnes: null, status: 'quarantined' });
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

        const tonnes = Math.round(route.tonnes * (1 + j3));

        trips.push({
          id: tripId,
          route: routeId,
          week: w,
          delay: +delay.toFixed(2),
          cpt: +cpt.toFixed(2),
          tonnes,
          status: 'clean',
        });
      }
    }
  }

  return trips;
}

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
  return Object.values(map).map(g => ({
    route: g.route,
    week: g.week,
    avgDelay: g.delays.reduce((a, b) => a + b, 0) / g.delays.length,
    avgCPT: g.cpts.reduce((a, b) => a + b, 0) / g.cpts.length,
    totalTonnes: g.tonnes.reduce((a, b) => a + b, 0),
  }));
}

function rolling3(routeWeekly, week, field) {
  const wks = [week - 2, week - 1, week].filter(w => w >= 1);
  const vals = wks.map(w => routeWeekly.find(d => d.week === w)?.[field]).filter(v => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function analyzeRoute(routeId, allWeekly) {
  const route = ROUTES[routeId];
  const rw = allWeekly.filter(d => d.route === routeId);

  let signalWeek = null;
  let blowoutWeek = null;

  for (let w = 1; w <= 12; w++) {
    if (!signalWeek) {
      const rd = rolling3(rw, w, 'avgDelay');
      if (rd !== null && rd > 6) signalWeek = w;
    }
    if (!blowoutWeek) {
      const rc = rolling3(rw, w, 'avgCPT');
      if (rc !== null && rc > route.baselineCPT * 1.12) blowoutWeek = w;
    }
  }

  const last3 = rw.filter(d => d.week >= 10);
  const latestTonnes = last3.reduce((s, d) => s + d.totalTonnes, 0);
  const latestAvgCPT =
    last3.length > 0 ? last3.reduce((s, d) => s + d.avgCPT, 0) / last3.length : route.baselineCPT;
  const avoidableCost = Math.max(0, latestTonnes * (latestAvgCPT - route.baselineCPT));
  const latestRollingDelay = rolling3(rw, 12, 'avgDelay');
  const drift = latestRollingDelay ?? 0;

  let risk = 'normal';
  if (signalWeek && blowoutWeek) risk = 'critical';
  else if (signalWeek || drift > 4) risk = 'watch';

  const weeklyData = Array.from({ length: 12 }, (_, i) => {
    const w = i + 1;
    const wdata = rw.find(d => d.week === w);
    return {
      week: w,
      label: `W${w}`,
      avgDelay: wdata?.avgDelay ?? null,
      avgCPT: wdata?.avgCPT ?? null,
      totalTonnes: wdata?.totalTonnes ?? null,
      rollingDelay: rolling3(rw, w, 'avgDelay'),
      rollingCPT: rolling3(rw, w, 'avgCPT'),
    };
  });

  return {
    routeId,
    origin: route.origin,
    dest: route.dest,
    baselineCPT: route.baselineCPT,
    baselineTransit: route.baselineTransit,
    signalWeek,
    blowoutWeek,
    avoidableCost,
    latestRollingDelay,
    latestAvgCPT,
    drift,
    risk,
    weeklyData,
  };
}

let _cache = null;

export function getSentinelData() {
  if (_cache) return _cache;

  const trips = generateTrips();
  const allWeekly = buildWeeklyAverages(trips);

  const routeAnalyses = {};
  for (const rId of ROUTE_IDS) {
    routeAnalyses[rId] = analyzeRoute(rId, allWeekly);
  }

  const totalAvoidableCost = Object.values(routeAnalyses).reduce((s, r) => s + r.avoidableCost, 0);

  _cache = {
    trips,
    allWeekly,
    routeAnalyses,
    kpis: {
      tripsIngested: 169,
      tripsClean: 167,
      tripsQuarantined: 1,
      avoidableCost: totalAvoidableCost,
    },
  };

  return _cache;
}

// ── Period-aware metrics (Week / Month / Quarter) ────────────────────────────
// Each tab scopes the KPIs to a trailing window of weeks and compares against
// the equal-length window immediately before it.
const WINDOWS = {
  week:    { weeks: [12],                                    prior: [11],                label: 'Latest week' },
  month:   { weeks: [9, 10, 11, 12],                         prior: [5, 6, 7, 8],        label: 'Latest 4 weeks' },
  quarter: { weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], prior: null,                label: 'Full 12-week survey' },
};

function aggregateRoute(weeklyData, weeks) {
  let tonnes = 0, cptSum = 0, cptN = 0, delaySum = 0, delayN = 0;
  for (const w of weeks) {
    const d = weeklyData.find(x => x.week === w);
    if (!d) continue;
    if (d.totalTonnes != null) tonnes += d.totalTonnes;
    if (d.avgCPT != null) { cptSum += d.avgCPT; cptN++; }
    if (d.avgDelay != null) { delaySum += d.avgDelay; delayN++; }
  }
  return {
    tonnes,
    avgCPT: cptN ? cptSum / cptN : null,
    avgDelay: delayN ? delaySum / delayN : null,
  };
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
    const isHot =
      (agg.avgDelay != null && agg.avgDelay > 4) ||
      (agg.avgCPT != null && agg.avgCPT > ra.baselineCPT * 1.12);
    if (isHot) hot++;
  }
  return { avoidable, tonnes, hot, routeTonnes };
}

function pctTrend(curV, priorV) {
  if (priorV == null || priorV === 0) return null;
  return ((curV - priorV) / priorV) * 100;
}

export function computePeriodMetrics(period) {
  const { routeAnalyses, trips } = getSentinelData();
  const win = WINDOWS[period] ?? WINDOWS.month;

  const cur = networkForWindow(routeAnalyses, win.weeks);
  const prior = win.prior ? networkForWindow(routeAnalyses, win.prior) : null;

  const tripCount = trips.filter(t => win.weeks.includes(t.week) && t.status === 'clean').length;

  return {
    period,
    routeTonnes: cur.routeTonnes,
    kpis: {
      avoidableCost: cur.avoidable,
      networkTonnes: cur.tonnes,
      hotSegments: cur.hot,
      inTransit: tripCount,
      routeCount: Object.keys(routeAnalyses).length,
      tripCount,
      avoidableTrend: prior ? pctTrend(cur.avoidable, prior.avoidable) : null,
      tonnesTrend: prior ? pctTrend(cur.tonnes, prior.tonnes) : null,
      periodLabel: win.label,
    },
  };
}
