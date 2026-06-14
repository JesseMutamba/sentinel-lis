'use client';

import { useState } from 'react';
import { getSentinelData } from '@/lib/data';
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

export default function Dashboard() {
  const [selectedRoute, setSelectedRoute] = useState('R3');
  const [activeTab, setActiveTab] = useState('map');
  const [period, setPeriod] = useState('month');

  const { kpis, routeAnalyses, trips } = SENTINEL_DATA;
  const routeAnalysis = routeAnalyses[selectedRoute];
  const routeTrips = trips.filter(t => t.route === selectedRoute);
  const routeIds = Object.keys(routeAnalyses);

  // Sorted for brief: critical first, then watch
  const alertRoutes = routeIds
    .map(id => routeAnalyses[id])
    .filter(r => r.risk !== 'normal')
    .sort((a, b) => (a.risk === 'critical' ? -1 : 1));

  const hotSegments = alertRoutes.length;
  const totalTonnes = Object.values(routeAnalyses).reduce((s, r) => {
    const last = r.weeklyData.filter(w => w.week >= 10);
    return s + last.reduce((a, b) => a + (b.totalTonnes ?? 0), 0);
  }, 0);

  function handleViewTrips(routeId) {
    setSelectedRoute(routeId);
    setActiveTab('trips');
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0f1a', color: '#f9fafb' }}>

      {/* ── Navigation Bar ── */}
      <nav style={{
        backgroundColor: '#0d1220',
        borderBottom: '1px solid #1a2236',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        height: 52,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 40 }}>
          <div style={{
            width: 32, height: 32,
            backgroundColor: '#eab308',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 18, color: '#0a0f1a', letterSpacing: '-1px',
          }}>S</div>
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#f9fafb' }}>
            Sentinel LIS
          </span>
        </div>

        {/* Nav links */}
        {NAV_LINKS.map(link => {
          const isActive = link === 'Corridors';
          return (
            <button key={link} style={{
              padding: '0 16px',
              height: 52,
              fontSize: 12,
              fontWeight: isActive ? 700 : 400,
              color: isActive ? '#eab308' : '#6b7280',
              borderBottom: isActive ? '2px solid #eab308' : '2px solid transparent',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              {link}
            </button>
          );
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ fontSize: 12, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 12px' }}>
            Sign In
          </button>
          <button style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '7px 16px',
            border: '1px solid #eab308',
            borderRadius: 4,
            color: '#eab308',
          }}>
            Upload Data
          </button>
        </div>
      </nav>

      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Subtitle row ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Corridor Intelligence System
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#eab308',
                backgroundColor: '#1c1a05', border: '1px solid #78580a',
                padding: '1px 8px', borderRadius: 3, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                Sample Data
              </span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f9fafb', lineHeight: 1.2, marginBottom: 6, letterSpacing: '-0.02em' }}>
              Southern &amp; Eastern Africa Corridor Flow
            </h1>
            <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.55, maxWidth: 520 }}>
              A working intelligence view of how freight data becomes corridor signal: where material
              is moving, where delays are forming, where cost is leaking — and which trips support each metric.
            </p>
          </div>

          {/* Period toggle */}
          <div style={{ display: 'flex', gap: 0, border: '1px solid #1f2937', borderRadius: 6, overflow: 'hidden', flexShrink: 0, marginTop: 4 }}>
            {['week', 'month', 'quarter'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '7px 18px',
                  fontSize: 12, fontWeight: period === p ? 700 : 400,
                  color: period === p ? '#0a0f1a' : '#6b7280',
                  backgroundColor: period === p ? '#eab308' : 'transparent',
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  borderRight: p !== 'quarter' ? '1px solid #1f2937' : 'none',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <KPICards
          kpis={kpis}
          hotSegments={hotSegments}
          totalTonnes={totalTonnes}
        />

        {/* ── Main: corridor map + brief ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14, alignItems: 'start' }}>

          {/* Left – Tab Panel */}
          <div style={{
            backgroundColor: '#0d1220',
            border: '1px solid #1a2236',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #1a2236', backgroundColor: '#0a0f1a' }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '11px 22px',
                    fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 400,
                    color: activeTab === tab.id ? '#eab308' : '#4b5563',
                    borderBottom: `2px solid ${activeTab === tab.id ? '#eab308' : 'transparent'}`,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: 20 }}>
              {activeTab === 'map' && (
                <CorridorMap
                  routeAnalyses={routeAnalyses}
                  selectedRoute={selectedRoute}
                  onRouteSelect={setSelectedRoute}
                />
              )}
              {activeTab === 'trends' && (
                <WeeklyTrends routeAnalysis={routeAnalysis} />
              )}
              {activeTab === 'trips' && (
                <TripEvidence trips={routeTrips} routeAnalysis={routeAnalysis} />
              )}
            </div>
          </div>

          {/* Right – Intelligence Brief */}
          <IntelligenceBrief
            alertRoutes={alertRoutes}
            routeAnalyses={routeAnalyses}
            selectedRoute={selectedRoute}
            onRouteSelect={routeId => { setSelectedRoute(routeId); setActiveTab('map'); }}
            onViewTrips={handleViewTrips}
          />
        </div>

        {/* ── Route chips ── */}
        <div style={{
          backgroundColor: '#0d1220',
          border: '1px solid #1a2236',
          borderRadius: 8,
          padding: '12px 18px',
        }}>
          <RouteChips
            routes={routeIds}
            routeAnalyses={routeAnalyses}
            selected={selectedRoute}
            onSelect={setSelectedRoute}
          />
        </div>

      </div>
    </div>
  );
}
