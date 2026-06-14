'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  sampleRows, computeFromTrips, computePeriodMetrics, buildExplanations,
} from '@/lib/data';
import { parseTripsCSV } from '@/lib/csv';
import { SAMPLE_FILE_NAME } from '@/lib/sampleCsv';
import { THEME } from '@/lib/theme';
import KPICards from './KPICards';
import CorridorMap from './CorridorMap';
import WeeklyTrends from './WeeklyTrends';
import TripEvidence from './TripEvidence';
import IntelligenceBrief from './IntelligenceBrief';
import RouteChips from './RouteChips';
import AnalystLayer from './AnalystLayer';
import UploadModal from './UploadModal';

const TABS = [
  { id: 'map',    label: 'Corridor Map' },
  { id: 'trends', label: 'Weekly Trends' },
  { id: 'trips',  label: 'Trip Evidence' },
];
const NAV_LINKS = ['Solutions', 'Logistics', 'Pricing', 'About', 'Contact'];
const PERIODS = ['week', 'month', 'quarter'];
const STORAGE_KEY = 'lumnia.dataset';
const POLL_MS = 10000;

// Deploy-wide default live source. Override in Vercel env (NEXT_PUBLIC_LIVE_SOURCE_URL);
// falls back to the connected Kamoa demo sheet. When the user hasn't connected
// their own source, the demo auto-connects to this on load.
const DEFAULT_LIVE_URL = (process.env.NEXT_PUBLIC_LIVE_SOURCE_URL
  || 'https://docs.google.com/spreadsheets/d/1tJg7E97GOzndqQZrH8wTKay3z7PRZj_9YAz-m3V6VU0/edit?gid=40456982#gid=40456982').trim();

// Route every remote fetch through our same-origin proxy (no CORS). The proxy
// expands a Google Sheets link into CSV endpoints; we just add a cache-buster.
function proxied(rawUrl) {
  return `/api/source?url=${encodeURIComponent(rawUrl)}&_cb=${Date.now()}`;
}

const SAMPLE_TRIPS = sampleRows();

function hostOf(url) { try { return new URL(url).host; } catch { return url; } }
function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const data = useMemo(() => computeFromTrips(trips), [trips]);
  const metrics = useMemo(() => computePeriodMetrics(data, period), [data, period]);
  const explanations = useMemo(() => buildExplanations(data, metrics), [data, metrics]);

  const routeIds = Object.keys(data.routeAnalyses);
  const focusRoute = data.routeAnalyses[selectedRoute] ? selectedRoute : (data.heroId || routeIds[0]);
  const routeAnalysis = data.routeAnalyses[focusRoute];
  const routeTrips = data.trips.filter(t => t.route === focusRoute);
  const hero = data.routeAnalyses[data.heroId];

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

  const fetchUrl = useCallback(async (url, { announce = false } = {}) => {
    try {
      const res = await fetch(proxied(url), { cache: 'no-store' });
      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
      const text = await res.text();
      const { trips: rows, errors } = parseTripsCSV(text);
      if (errors.length || !rows.length) throw new Error(errors[0] || 'No rows parsed');
      const hash = `${rows.length}:${text.length}`;
      const changed = hash !== lastHashRef.current;
      lastHashRef.current = hash;
      if (changed || announce) persist(rows, { kind: 'url', url, at: Date.now(), status: 'ok' });
      else setSource(s => (s.kind === 'url' ? { ...s, at: Date.now(), status: 'ok' } : s));
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

  useEffect(() => {
    let restored = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.trips?.length) {
          setTrips(saved.trips);
          setSource(saved.source ?? { kind: 'upload' });
          restored = true;
        }
      }
    } catch { /* ignore */ }
    // No user source yet → auto-connect the configured default live source
    if (!restored && DEFAULT_LIVE_URL) connectUrl(DEFAULT_LIVE_URL);
  }, [connectUrl]);

  useEffect(() => {
    clearInterval(pollRef.current);
    if (source.kind !== 'url' || !source.url) return;
    pollRef.current = setInterval(() => fetchUrl(source.url), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [source.kind, source.url, fetchUrl]);

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

  const navActive = { color: THEME.goldBright, border: THEME.accent };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: THEME.bg, color: THEME.text }}>

      {/* ── Nav ── */}
      <nav style={{
        backgroundColor: THEME.nav, borderBottom: `1px solid ${THEME.border}`,
        padding: '0 28px', display: 'flex', alignItems: 'center', height: 54, position: 'sticky', top: 0, zIndex: 20,
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
          const isActive = link === 'Logistics';
          return (
            <button key={link} style={{
              padding: '0 16px', height: 54, fontSize: 12, fontWeight: isActive ? 700 : 400,
              color: isActive ? navActive.color : THEME.muted,
              borderBottom: `2px solid ${isActive ? navActive.border : 'transparent'}`,
              letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>{link}</button>
          );
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button style={{ fontSize: 12, color: THEME.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sign In</button>
          <button onClick={() => setModalOpen(true)} style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '7px 16px', borderRadius: 4, backgroundColor: THEME.accent, color: THEME.onAccent,
          }}>Upload Data</button>
        </div>
      </nav>

      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Title + period toggle ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: THEME.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Logistics Intelligence System
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: THEME.goldBright,
                backgroundColor: '#1c1606', border: `1px solid ${THEME.goldDeep}`,
                padding: '1px 8px', borderRadius: 3, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {source.kind === 'sample' ? 'Synthetic Data' : 'Live Data'}
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15, marginBottom: 6, letterSpacing: '-0.02em' }}>
              Kamoa Corridor Flow Map
            </h1>
            <p style={{ fontSize: 12, color: THEME.muted, lineHeight: 1.55, maxWidth: 560 }}>
              A working view of how Lumnia turns fragmented logistics rows into corridor intelligence:
              where material is moving, where delays are forming, where cost is leaking — and which
              trips support each signal.
            </p>
          </div>

          <div style={{ display: 'flex', border: `1px solid ${THEME.borderSoft}`, borderRadius: 6, overflow: 'hidden', flexShrink: 0, marginTop: 4 }}>
            {PERIODS.map((p, i) => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '7px 18px', fontSize: 12, fontWeight: period === p ? 700 : 500,
                color: period === p ? THEME.onAccent : THEME.muted,
                backgroundColor: period === p ? THEME.accent : 'transparent',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                borderLeft: i ? `1px solid ${THEME.borderSoft}` : 'none',
              }}>{p}</button>
            ))}
          </div>
        </div>

        {/* ── Data source status strip ── */}
        <DataSourceStrip source={source} data={data} onManage={() => setModalOpen(true)} onRefresh={manualRefresh} onReset={loadSample} />

        {/* ── KPI cards ── */}
        <KPICards metrics={metrics.kpis} explanations={explanations} hero={hero} />

        {/* ── Connected analyst layer ── */}
        <AnalystLayer integrity={data.integrity} thresholds={data.thresholds} source={source} />

        {/* ── Map + brief ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14, alignItems: 'start' }}>
          <div style={{ backgroundColor: THEME.panel, border: `1px solid ${THEME.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: `1px solid ${THEME.border}`, backgroundColor: THEME.bg }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '11px 22px', fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 400,
                  color: activeTab === tab.id ? THEME.goldBright : THEME.faint,
                  borderBottom: `2px solid ${activeTab === tab.id ? THEME.accent : 'transparent'}`,
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
            selected={routeAnalysis}
            routeAnalyses={data.routeAnalyses}
            integrity={data.integrity}
            onSelectRoute={routeId => { setSelectedRoute(routeId); setActiveTab('map'); }}
            onViewTrips={routeId => { setSelectedRoute(routeId); setActiveTab('trips'); }}
          />
        </div>

        {/* ── Route chips ── */}
        <div style={{ backgroundColor: THEME.panel, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: '12px 18px' }}>
          <RouteChips routes={routeIds} routeAnalyses={data.routeAnalyses} selected={focusRoute} onSelect={setSelectedRoute} />
        </div>

        {/* ── Footer ── */}
        <div style={{ fontSize: 11, color: THEME.faint, textAlign: 'center', padding: '6px 0 8px', letterSpacing: '0.02em' }}>
          {source.kind === 'sample' ? 'Synthetic export' : source.kind === 'url' ? `Live feed · ${hostOf(source.url)}` : 'Uploaded export'} · {data.integrity.rawRows} raw rows → {data.integrity.cleanTrips} clean trips · {data.integrity.duplicatesDropped} duplicate{data.integrity.duplicatesDropped === 1 ? '' : 's'} dropped · {data.integrity.rowsNeedingReview} held for review
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
  const ig = data.integrity;
  let dot = THEME.muted, label, detail;
  if (source.kind === 'sample') {
    dot = THEME.muted; label = 'Bundled synthetic demo'; detail = SAMPLE_FILE_NAME;
  } else if (source.kind === 'upload') {
    dot = THEME.gold; label = 'Uploaded session'; detail = `ingested ${fmtTime(source.at)}`;
  } else {
    const ok = source.status !== 'error';
    dot = ok ? THEME.greenBright : THEME.critical;
    label = ok ? 'Live source' : 'Live source error';
    detail = ok ? `${hostOf(source.url)} · synced ${fmtTime(source.at)} · auto-refresh on` : source.error;
  }

  const stats = [
    `${ig.rawRows} source rows`,
    `${ig.cleanTrips} analyzed`,
    `${ig.rowsNeedingReview} held out`,
    `${ig.duplicatesDropped} duplicates dropped`,
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      backgroundColor: THEME.panel, border: `1px solid ${source.status === 'error' ? THEME.critical : THEME.border}`,
      borderRadius: 8, padding: '10px 14px',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: dot, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 9.5, color: THEME.faint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ fontSize: 12, color: THEME.text, fontWeight: 600 }}>{detail}</span>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginLeft: 8 }}>
        {stats.map(s => <span key={s} style={{ fontSize: 11, color: THEME.textDim }}>{s}</span>)}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
        {source.kind === 'url' && <button onClick={onRefresh} style={{ fontSize: 11.5, color: THEME.greenBright, fontWeight: 700 }}>↻ Refresh now</button>}
        {source.kind !== 'sample' && <button onClick={onReset} style={{ fontSize: 11.5, color: THEME.muted, fontWeight: 700 }}>Reset demo</button>}
        <button onClick={onManage} style={{ fontSize: 11.5, color: THEME.textDim, fontWeight: 700 }}>Manage source</button>
      </div>
    </div>
  );
}
