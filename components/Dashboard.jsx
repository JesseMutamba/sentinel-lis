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

export default function Dashboard() {
  const [selectedRoute, setSelectedRoute] = useState('R3');
  const [activeTab, setActiveTab] = useState('map');

  const { kpis, routeAnalyses, trips } = SENTINEL_DATA;
  const routeAnalysis = routeAnalyses[selectedRoute];
  const routeTrips = trips.filter(t => t.route === selectedRoute);
  const routeIds = Object.keys(routeAnalyses);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0f1a', color: '#f9fafb' }}>
      {/* ── Header ── */}
      <header
        style={{
          backgroundColor: '#111827',
          borderBottom: '1px solid #1f2937',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {/* S logo */}
        <div
          style={{
            width: 38,
            height: 38,
            backgroundColor: '#eab308',
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 22,
            color: '#0a0f1a',
            flexShrink: 0,
            letterSpacing: '-1px',
          }}
        >
          S
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Sentinel LIS
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, letterSpacing: '0.04em' }}>
            Corridor Intelligence Platform
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#374151' }}>
          12-week survey · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </header>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* ── KPI Row ── */}
        <KPICards kpis={kpis} />

        {/* ── Main content: Left panel + Right panel ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
          {/* Left — Tab Panel */}
          <div
            style={{
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1f2937', backgroundColor: '#0d1526' }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '12px 22px',
                    fontSize: 13,
                    fontWeight: activeTab === tab.id ? 700 : 400,
                    color: activeTab === tab.id ? '#eab308' : '#6b7280',
                    borderBottom: `2px solid ${activeTab === tab.id ? '#eab308' : 'transparent'}`,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.1s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: 20 }}>
              {activeTab === 'map' && (
                <CorridorMap
                  routeAnalyses={routeAnalyses}
                  selectedRoute={selectedRoute}
                  onRouteSelect={routeId => { setSelectedRoute(routeId); }}
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

          {/* Right — Intelligence Brief */}
          <IntelligenceBrief routeAnalysis={routeAnalysis} selectedRoute={selectedRoute} />
        </div>

        {/* ── Route chips ── */}
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: 8,
            padding: '14px 18px',
          }}
        >
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
