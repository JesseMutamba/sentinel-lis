'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  generateTrips, computeFromTrips, computePeriodMetrics, buildExplanations,
} from '@/lib/data';
import { parseTripsCSV } from '@/lib/csv';
import { THEME } from '@/lib/theme';
import KPICards from './KPICards';
import CorridorMap from './CorridorMap';
import WeeklyTrends from './WeeklyTrends';
import TripEvidence from './TripEvidence';
import IntelligenceBrief from './IntelligenceBrief';
import RouteChips from './RouteChips';
import UploadModal from './UploadModal';

const TABS = [
  { id: 'map',    label: 'Corridor Map' },
  { id: 'trends', label: 'Weekly Trends' },
  { id: 'trips',  label: 'Trip Evidence' },
];
const NAV_LINKS = ['Overview', 'Corridors', 'Analytics', 'Reports', 'About'];
const PERIODS = ['week', 'month', 'quarter'];
const STORAGE_KEY = 'lumnia.dataset';
const POLL_MS = 15000;

const SAMPLE_TRIPS = generateTrips();

function hostOf(url) {
  try { return new URL(url).host; } catch { return url; }
}
function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function Dashboard() {
  const [trips, setTrips] = useState(SAMPLE_TRIPS);
  const [source, setSource] = useState({ kind: 'sample' });
  const [selectedRoute, setSelectedRoute] = useState('R3');
  const [activeTab, setActiveTab] = useState('map');
  const [period, setPeriod] = useState('month');
  const [modalOpen, setModalOpen] = useState(false);

  const pollRef = useRef(null);
  const lastHashRef = useRef('');

  // ── Derived analytics — recompute whenever the dataset changes ──
  const data = useMemo(() => computeFromTrips(trips), [trips]);
  const metrics = useMemo(() => computePeriodMetrics(data, period), [data, period]);
  const explanations = useMemo(() => buildExplanations(data, metrics), [data, metrics]);

  const routeIds = Object.keys(data.routeAnalyses);
  const focusRoute = data.routeAnalyses[selectedRoute] ? selectedRoute : routeIds[0];
  const routeAnalysis = data.routeAnalyses[focusRoute];
  const routeTrips = data.trips.filter(t => t.route === focusRoute);
  const alertRoutes = routeIds
    .map(id => data.routeAnalyses[id])
    .filter(r => r.risk !== 'normal')
    .sort((a, b) => (a.risk === 'critical' ? -1 : 1));

  // ── Persistence helpers ──
  const persist = useCallback((nextTrips, nextSource) => {
    setTrips(nextTrips);
    setSource(nextSource);
    try {
      if (nextSource.kind === 'sample') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify({ trips: nextTrips, source: nextSource }));
    } catch { /* storage unavailable */ }
  }, []);

  const loadSample = useCallback(() => {
    lastHashRef.current = '';
    persist(SAMPLE_TRIPS, { kind: 'sample' });
    setModalOpen(false);
  }, [persist]);

  const ingest = useCallback((rawTrips) => {
    lastHashRef.current = '';
    persist(rawTrips, { kind: 'upload', at: Date.now(), count: rawTrips.length });
    setModalOpen(false);
  }, [persist]);

  // Fetch + parse a remote CSV; returns true if data changed
  const fetchUrl = useCallback(async (url, { announce = false } = {}) => {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const { trips: rows, errors } = parseTripsCSV(text);
      if (errors.length || !rows.length) throw new Error(errors[0] || 'No rows parsed');
      const hash = `${rows.length}:${text.length}`;
      const changed = hash !== lastHashRef.current;
      lastHashRef.current = hash;
      if (changed || announce) {
        persist(rows, { kind: 'url', url, at: Date.now(), status: 'ok' });
      } else {
        setSource(s => (s.kind === 'url' ? { ...s, at: Date.now(), status: 'ok' } : s));
      }
      return changed;
    } catch (e) {
      setSource(s => (s.kind === 'url' ? { ...s, status: 'error', error: String(e.message || e), at: Date.now() } : s));
      return false;
    }
  }, [persist]);

  const connectUrl = useCallback((url) => {
    lastHashRef.current = '';
    setModalOpen(false);
    fetchUrl(url, { announce: true });
  }, [fetchUrl]);

  // ── Hydrate from localStorage once (client only) ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.trips?.length) {
        setTrips(saved.trips);
        setSource(saved.source ?? { kind: 'upload' });
      }
    } catch { /* ignore */ }
  }, []);

  // ── Live: poll the connected URL ──
  useEffect(() => {
    clearInterval(pollRef.current);
    if (source.kind !== 'url' || !source.url) return;
    pollRef.current = setInterval(() => fetchUrl(source.url), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [source.kind, source.url, fetchUrl]);

  // ── Live: cross-tab sync + refetch on focus ──
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== STORAGE_KEY) return;
      try {
        if (!e.newValue) { setTrips(SAMPLE_TRIPS); setSource({ kind: 'sample' }); return; }
        const saved = JSON.parse(e.newValue);
        if (saved?.trips?.length) { setTrips(saved.trips); setSource(saved.source ?? { kind: 'upload' }); }
      } catch { /* ignore */ }
    }
    function onFocus() { if (source.kind === 'url' && source.url) fetchUrl(source.url); }
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('focus', onFocus); };
  }, [source.kind, source.url, fetchUrl]);

  const manualRefresh = () => { if (source.kind === 'url' && source.url) fetchUrl(source.url, { announce: true }); };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: THEME.bg, color: THEME.text }}>

      {/* ── Nav ── */}
      <nav style={{
        backgroundColor: THEME.nav, borderBottom: `1px solid ${THEME.border}`,
        padding: '0 28px', display: 'flex', alignItems: 'center', height: 54,
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginRight: 42 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${THEME.green}, ${THEME.greenDeep})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 18, color: THEME.goldBright, letterSpacing: '-1px',
            boxShadow: `0 0 0 1px ${THEME.greenDeep}`,
          }}>L</div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Lumnia</span>
        </div>

        {NAV_LINKS.map(link => {
          const isActive = link === 'Corridors';
          return (
            <button key={link} style={{
              padding: '0 16px', height: 54, fontSize: 12, fontWeight: isActive ? 700 : 400,
              color: isActive ? THEME.greenBright : THEME.muted,
              borderBottom: `2px solid ${isActive ? THEME.green : 'transparent'}`,
              letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>{link}</button>
          );
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button style={{ fontSize: 12, color: THEME.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sign In</button>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '7px 16px', border: `1px solid ${THEME.gold}`, borderRadius: 4, color: THEME.goldBright,
            }}
          >
            Upload Data
          </button>
        </div>
      </nav>

      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Title + period toggle ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: THEME.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Corridor Intelligence System
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: THEME.goldBright,
                backgroundColor: '#1c1a05', border: `1px solid ${THEME.greenDeep}`,
                padding: '1px 8px', borderRadius: 3, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {source.kind === 'sample' ? 'Sample Data' : 'Live Data'}
              </span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 6, letterSpacing: '-0.02em' }}>
              Southern &amp; Eastern Africa Corridor Flow
            </h1>
            <p style={{ fontSize: 12, color: THEME.muted, lineHeight: 1.55, maxWidth: 540 }}>
              A working view of how Lumnia turns fragmented freight data into corridor intelligence:
              where material is moving, where delays are forming, where cost is leaking — and which
              trips support each metric.
            </p>
          </div>

          <div style={{ display: 'flex', border: `1px solid ${THEME.borderSoft}`, borderRadius: 6, overflow: 'hidden', flexShrink: 0, marginTop: 4 }}>
            {PERIODS.map((p, i) => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '7px 18px', fontSize: 12, fontWeight: period === p ? 700 : 500,
                color: period === p ? '#06281e' : THEME.muted,
                backgroundColor: period === p ? THEME.green : 'transparent',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                borderLeft: i ? `1px solid ${THEME.borderSoft}` : 'none',
              }}>{p}</button>
            ))}
          </div>
        </div>

        {/* ── Data source status strip ── */}
        <DataSourceStrip source={source} data={data} onManage={() => setModalOpen(true)} onRefresh={manualRefresh} onReset={loadSample} />

        {/* ── KPI cards ── */}
        <KPICards metrics={metrics.kpis} explanations={explanations} />

        {/* ── Map + brief ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14, alignItems: 'start' }}>
          <div style={{ backgroundColor: THEME.panel, border: `1px solid ${THEME.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: `1px solid ${THEME.border}`, backgroundColor: THEME.bg }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '11px 22px', fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 400,
                  color: activeTab === tab.id ? THEME.greenBright : THEME.faint,
                  borderBottom: `2px solid ${activeTab === tab.id ? THEME.green : 'transparent'}`,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>{tab.label}</button>
              ))}
            </div>
            <div style={{ padding: 20 }}>
              {activeTab === 'map' && (
                <CorridorMap routeAnalyses={data.routeAnalyses} routeTonnes={metrics.routeTonnes} selectedRoute={focusRoute} onRouteSelect={setSelectedRoute} />
              )}
              {activeTab === 'trends' && <WeeklyTrends routeAnalysis={routeAnalysis} />}
              {activeTab === 'trips'  && <TripEvidence trips={routeTrips} routeAnalysis={routeAnalysis} />}
            </div>
          </div>

          <IntelligenceBrief
            alertRoutes={alertRoutes}
            routeAnalyses={data.routeAnalyses}
            selectedRoute={focusRoute}
            onRouteSelect={routeId => { setSelectedRoute(routeId); setActiveTab('map'); }}
            onViewTrips={routeId => { setSelectedRoute(routeId); setActiveTab('trips'); }}
          />
        </div>

        {/* ── Route chips ── */}
        <div style={{ backgroundColor: THEME.panel, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: '12px 18px' }}>
          <RouteChips routes={routeIds} routeAnalyses={data.routeAnalyses} selected={focusRoute} onSelect={setSelectedRoute} />
        </div>
      </div>

      <UploadModal
        open={modalOpen}
        source={source}
        onClose={() => setModalOpen(false)}
        onIngest={ingest}
        onLoadSample={loadSample}
        onConnectUrl={connectUrl}
      />
    </div>
  );
}

function DataSourceStrip({ source, data, onManage, onRefresh, onReset }) {
  let dot = THEME.muted, text;
  if (source.kind === 'sample') {
    dot = THEME.muted;
    text = <>Sample dataset · {data.kpis.tripsIngested} trips ({data.kpis.tripsClean} clean · {data.kpis.tripsQuarantined} quarantined)</>;
  } else if (source.kind === 'upload') {
    dot = THEME.gold;
    text = <>Uploaded dataset · {data.kpis.tripsIngested} trips ingested · {data.kpis.tripsClean} clean · {data.kpis.tripsQuarantined} quarantined · {fmtTime(source.at)}</>;
  } else {
    const ok = source.status !== 'error';
    dot = ok ? THEME.greenBright : THEME.critical;
    text = ok
      ? <>Live · {hostOf(source.url)} · {data.kpis.tripsClean} clean trips · synced {fmtTime(source.at)} · auto-refresh on</>
      : <>Live source error ({source.error}) · showing last good data</>;
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      backgroundColor: THEME.panel, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: '9px 14px',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: dot, flexShrink: 0 }} />
      <span style={{ fontSize: 11.5, color: THEME.textDim }}>{text}</span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
        {source.kind === 'url' && (
          <button onClick={onRefresh} style={{ fontSize: 11.5, color: THEME.greenBright, fontWeight: 600 }}>↻ Refresh now</button>
        )}
        {source.kind !== 'sample' && (
          <button onClick={onReset} style={{ fontSize: 11.5, color: THEME.muted, fontWeight: 600 }}>Reset to sample</button>
        )}
        <button onClick={onManage} style={{ fontSize: 11.5, color: THEME.textDim, fontWeight: 600 }}>Manage source</button>
      </div>
    </div>
  );
}
