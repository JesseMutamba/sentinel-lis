// ─────────────────────────────────────────────────────────────────────────────
// Sentinel LIS — Kamoa Corridor data model
//
// Deterministic corridor-intelligence dataset for the Kamoa–Kakula copper
// corridor (DRC → Lobito Port / Kasumbalesa). All figures are reproducible:
// route-level metrics are curated to a known scenario, trip-level evidence is
// generated with a seeded LCG so "View trips" is consistent run-to-run.
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

// ── Corridor topology ────────────────────────────────────────────────────────
// Risk classification:
//   over    → cost blown out above baseline (critical)
//   above   → mild cost drift above baseline (hot, not critical)
//   on      → operating on baseline (healthy)
//   nocost  → no cost data yet; transit drift is the early signal (watch)

export const ROUTES = {
  R1: {
    id: 'R1', from: 'Kamoa Mine', to: 'Concentrator',
    tonnes: 700, baselineCPT: 14, actualCPT: 14, plannedTransit: 4, actualTransit: 4,
    costData: true, state: 'on', avoidable: 0, transitTrendPct: 0.4,
  },
  R2: {
    id: 'R2', from: 'Kakula Mine', to: 'Concentrator',
    tonnes: 675, baselineCPT: 15, actualCPT: 15, plannedTransit: 5, actualTransit: 5,
    costData: true, state: 'on', avoidable: 0, transitTrendPct: 0.7,
  },
  R3: {
    id: 'R3', from: 'Concentrator', to: 'Smelter',
    tonnes: 410, baselineCPT: 95, actualCPT: 103, plannedTransit: 6, actualTransit: 6.4,
    costData: true, state: 'above', avoidable: 3200, transitTrendPct: 2.1,
  },
  R4: {
    id: 'R4', from: 'Smelter', to: 'Kolwezi Yard',
    tonnes: 385, baselineCPT: 130, actualCPT: 138, plannedTransit: 8, actualTransit: 8.5,
    costData: true, state: 'above', avoidable: 3140, transitTrendPct: 2.8,
  },
  R5: {
    id: 'R5', from: 'Kolwezi Yard', to: 'Lobito Port',
    tonnes: 1005, baselineCPT: 108, actualCPT: 187, plannedTransit: 96, actualTransit: 99.6,
    costData: true, state: 'over', avoidable: 31540, transitTrendPct: 3.8,
  },
  R6: {
    id: 'R6', from: 'Kolwezi Yard', to: 'Kasumbalesa',
    tonnes: 240, baselineCPT: null, actualCPT: null, plannedTransit: 28, actualTransit: 33,
    costData: false, state: 'nocost', avoidable: 0, transitTrendPct: 13.6,
  },
};

const ROUTE_IDS = Object.keys(ROUTES);

// Number of trips backing each route (sums to 14)
const TRIP_COUNTS = { R1: 2, R2: 2, R3: 2, R4: 2, R5: 4, R6: 2 };
const QUARANTINED_ID = 'KMO-2026-W06-008';

// ── Trip evidence ────────────────────────────────────────────────────────────
function generateTrips() {
  const trips = [];
  let globalIdx = 0;

  for (const routeId of ROUTE_IDS) {
    const route = ROUTES[routeId];
    const count = TRIP_COUNTS[routeId];

    for (let t = 0; t < count; t++) {
      globalIdx++;
      const week = ((globalIdx - 1) % 12) + 1;
      const seq = globalIdx;
      const tripId = `KMO-2026-W${String(week).padStart(2, '0')}-${String(seq).padStart(3, '0')}`;

      // Quarantine: the known bad record on the Kasumbalesa leg
      if (tripId === QUARANTINED_ID || (routeId === 'R6' && t === 0)) {
        trips.push({
          id: routeId === 'R6' && t === 0 ? QUARANTINED_ID : tripId,
          route: routeId, leg: `${route.from} → ${route.to}`, week,
          tonnes: null, cpt: null, transit: null, status: 'quarantined',
        });
        continue;
      }

      const rng = lcg(globalIdx * 9973 + 7);
      const j = (rng.next() - 0.5);
      const jt = (rng.next() - 0.5);

      const tonnes = Math.round((route.tonnes / count) * (1 + j * 0.18));
      const cpt = route.costData ? +(route.actualCPT * (1 + j * 0.07)).toFixed(2) : null;
      const transit = +(route.actualTransit * (1 + jt * 0.08)).toFixed(1);

      trips.push({
        id: tripId,
        route: routeId,
        leg: `${route.from} → ${route.to}`,
        week,
        tonnes,
        cpt,
        transit,
        status: route.costData ? 'clean' : 'no-cost-data',
      });
    }
  }

  return trips;
}

// ── Weekly trend series (for the Weekly Trends tab) ──────────────────────────
// Builds a 12-week deterministic series per route that lands on the route's
// current actual transit / CPT, with a believable ramp for hot routes.
function buildWeekly(route) {
  const rng = lcg((route.id.charCodeAt(1) || 1) * 1311 + 17);
  const weeks = [];

  for (let w = 1; w <= 12; w++) {
    const p = (w - 1) / 11; // 0 → 1 across the survey
    const noise = (rng.next() - 0.5);

    let transit;
    if (route.state === 'over' || route.state === 'nocost') {
      // ramping deterioration toward the current actual
      transit = route.plannedTransit + (route.actualTransit - route.plannedTransit) * p + noise * 0.6;
    } else {
      transit = route.actualTransit + noise * 0.4;
    }

    let cpt = null;
    if (route.costData) {
      if (route.state === 'over') {
        cpt = route.baselineCPT + (route.actualCPT - route.baselineCPT) * Math.pow(p, 1.4) + noise * 2;
      } else {
        cpt = route.actualCPT + noise * 1.5;
      }
    }

    weeks.push({
      week: w,
      label: `W${w}`,
      transit: +transit.toFixed(1),
      cpt: cpt === null ? null : +cpt.toFixed(2),
    });
  }
  return weeks;
}

// ── Analysis / derived view model ────────────────────────────────────────────
function analyze(route, networkAvoidable) {
  const driftPct = route.plannedTransit
    ? ((route.actualTransit - route.plannedTransit) / route.plannedTransit) * 100
    : 0;

  let risk = 'normal';
  if (route.state === 'over') risk = 'critical';
  else if (route.state === 'nocost' || route.state === 'above') {
    risk = route.state === 'nocost' && driftPct > 4 ? 'watch'
      : route.state === 'above' ? 'hot' : 'normal';
  }
  // 'hot' = above-baseline cost but not critical; treated as elevated, shown amber
  if (route.state === 'nocost') risk = driftPct > 4 ? 'watch' : 'normal';

  const sharePct = networkAvoidable > 0 ? Math.round((route.avoidable / networkAvoidable) * 100) : 0;

  return {
    ...route,
    risk,
    driftPct,
    sharePct,
    weekly: buildWeekly(route),
  };
}

let _cache = null;

export function getSentinelData() {
  if (_cache) return _cache;

  const trips = generateTrips();

  const networkAvoidable = ROUTE_IDS.reduce((s, id) => s + ROUTES[id].avoidable, 0); // 37,880
  const networkTonnes = ROUTE_IDS.reduce((s, id) => s + ROUTES[id].tonnes, 0);       // 3,415

  const routeAnalyses = {};
  for (const id of ROUTE_IDS) {
    routeAnalyses[id] = analyze(ROUTES[id], networkAvoidable);
  }

  // Hot segments = routes above cost baseline OR drifting on transit time
  const hotSegments = ROUTE_IDS.filter(id => {
    const r = ROUTES[id];
    return r.state === 'over' || r.state === 'above' || (r.state === 'nocost' && routeAnalyses[id].driftPct > 4);
  }).length;

  _cache = {
    trips,
    routeAnalyses,
    kpis: {
      avoidableCost: networkAvoidable,        // 37,880
      avoidableTrendPct: 11.1,
      networkTonnes,                          // 3,415
      tonnesTrendPct: 3.8,
      routeCount: ROUTE_IDS.length,           // 6
      tripCount: trips.length,                // 14
      hotSegments,                            // 4
      inTransit: 3,
    },
  };

  return _cache;
}
