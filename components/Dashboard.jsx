'use client';

import { useState, useMemo } from 'react';
import { getSentinelData, computePeriodMetrics } from '@/lib/data';
import { THEME } from '@/lib/theme';
import KPICards from './KPICards';
import CorridorMap from './CorridorMap';
import WeeklyTrends from './WeeklyTrends';
import TripEvidence from './TripEvidence';
import IntelligenceBrief from './IntelligenceBrief';
import RouteChips from './RouteChips';

const SENTINEL_DATA = getSentinelData();

const TABS = [
  { id: 'map',    label: 'Corridor Map' },
  { id: 'trends', label: 'Weekly Trends' },
  { id: 'trips',  label: 'Trip Evidence' },
];

const NAV_LINKS = ['Overview', 'Corridors', 'Analytics', 'Reports', 'About'];
const PERIODS = ['week', 'month', 'quarter'];

export default function Dashboard() {
  const [selectedRoute, setSelectedRoute] = useState('R3');
  const [activeTab, setActiveTab] = useState('map');
  const [period, setPeriod] = useState('month');

  const { routeAnalyses, trips } = SENTINEL_DATA;
  const routeAnalysis = routeAnalyses[selectedRoute];
  const routeTrips = trips.filter(t => t.route === selectedRoute);
  const routeIds = Object.keys(routeAnalyses);

  // Period-scoped KPIs + per-route tonnage — recomputed when the tab changes
  const metrics = useMemo(() => computePeriodMetrics(period), [period]);

  const alertRoutes = routeIds
    .map(id => routeAnalyses[id])
    .filter(r => r.risk !== 'normal')
    .sort((a, b) => (a.risk === 'critical' ? -1 : 1));

  function handleViewTrips(routeId) {
    setSelectedRoute(routeId);
    setActiveTab('trips');
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: THEME.bg, color: THEME.text }}>

      {/* ── Navigation Bar ── */}
      <nav style={{
        backgroundColor: THEME.nav,
        borderBottom: `1px solid ${THEME.border}`,
        padding: '0 28px', display: 'flex', alignItems: 'center', height: 54,
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        {/* Logo — green mark, gold L */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginRight: 42 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${THEME.green}, ${THEME.greenDeep})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 18, color: THEME.goldBright, letterSpacing: '-1px',
            boxShadow: `0 0 0 1px ${THEME.greenDeep}`,
          }}>L</div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.16em', textTransform: 'uppercase', color: THEME.text }}>
            Lumnia
          </span>
        </div>

        {NAV_LINKS.map(link => {
          const isActive = link === 'Corridors';
          return (
            <button key={link} style={{
              padding: '0 16px', height: 54, fontSize: 12,
              fontWeight: isActive ? 700 : 400,
              color: isActive ? THEME.greenBright : THEME.muted,
              borderBottom: `2px solid ${isActive ? THEME.green : 'transparent'}`,
              letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>
              {link}
            </button>
          );
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button style={{ fontSize: 12, color: THEME.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Sign In
          </button>
          <button style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '7px 16px', border: `1px solid ${THEME.gold}`, borderRadius: 4, color: THEME.goldBright,
          }}>
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
                Sample Data
              </span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: THEME.text, lineHeight: 1.2, marginBottom: 6, letterSpacing: '-0.02em' }}>
              Southern &amp; Eastern Africa Corridor Flow
            </h1>
            <p style={{ fontSize: 12, color: THEME.muted, lineHeight: 1.55, maxWidth: 540 }}>
              A working view of how Lumnia turns fragmented freight data into corridor intelligence:
              where material is moving, where delays are forming, where cost is leaking — and which
              trips support each metric.
            </p>
          </div>

          {/* Period toggle — drives the KPI window */}
          <div style={{ display: 'flex', border: `1px solid ${THEME.borderSoft}`, borderRadius: 6, overflow: 'hidden', flexShrink: 0, marginTop: 4 }}>
            {PERIODS.map((p, i) => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '7px 18px', fontSize: 12,
                fontWeight: period === p ? 700 : 500,
                color: period === p ? '#06281e' : THEME.muted,
                backgroundColor: period === p ? THEME.green : 'transparent',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                borderLeft: i ? `1px solid ${THEME.borderSoft}` : 'none',
                transition: 'background-color 0.12s',
              }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI cards (period-aware) ── */}
        <KPICards metrics={metrics.kpis} />

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
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: 20 }}>
              {activeTab === 'map' && (
                <CorridorMap
                  routeAnalyses={routeAnalyses}
                  routeTonnes={metrics.routeTonnes}
                  selectedRoute={selectedRoute}
                  onRouteSelect={setSelectedRoute}
                />
              )}
              {activeTab === 'trends' && <WeeklyTrends routeAnalysis={routeAnalysis} />}
              {activeTab === 'trips'  && <TripEvidence trips={routeTrips} routeAnalysis={routeAnalysis} />}
            </div>
          </div>

          <IntelligenceBrief
            alertRoutes={alertRoutes}
            routeAnalyses={routeAnalyses}
            selectedRoute={selectedRoute}
            onRouteSelect={routeId => { setSelectedRoute(routeId); setActiveTab('map'); }}
            onViewTrips={handleViewTrips}
          />
        </div>

        {/* ── Route chips ── */}
        <div style={{ backgroundColor: THEME.panel, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: '12px 18px' }}>
          <RouteChips routes={routeIds} routeAnalyses={routeAnalyses} selected={selectedRoute} onSelect={setSelectedRoute} />
        </div>

      </div>
    </div>
  );
}
