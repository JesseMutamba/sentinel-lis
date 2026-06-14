'use client';

import { useState } from 'react';
import { getSentinelData } from '@/lib/data';
import KPICards from './KPICards';
import CorridorMap from './CorridorMap';
import WeeklyTrends from './WeeklyTrends';
import TripEvidence from './TripEvidence';
import IntelligenceBrief from './IntelligenceBrief';

const SENTINEL_DATA = getSentinelData();

const NAV_LINKS = ['Solutions', 'Logistics', 'Pricing', 'About', 'Contact'];
const TABS = [
  { id: 'map',    label: 'Corridor Flow Map' },
  { id: 'trends', label: 'Weekly Trends' },
  { id: 'trips',  label: 'Trip Evidence' },
];

export default function Dashboard() {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [period, setPeriod] = useState('month');

  const { kpis, routeAnalyses, trips } = SENTINEL_DATA;

  // Critical route is the natural focus when nothing is explicitly selected
  const focusRoute = selectedRoute ?? 'R5';
  const routeTrips = trips.filter(t => t.route === focusRoute);

  function viewTrips(routeId) {
    setSelectedRoute(routeId);
    setActiveTab('trips');
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0f1a', color: '#e5e7eb' }}>

      {/* ── Nav bar ── */}
      <nav style={{
        backgroundColor: '#0b1019', borderBottom: '1px solid #161e2e',
        padding: '0 28px', height: 54, display: 'flex', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 44 }}>
          <div style={{
            width: 30, height: 30, backgroundColor: '#eab308', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 17, color: '#0a0f1a', letterSpacing: '-1px',
          }}>S</div>
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Sentinel&nbsp;LIS
          </span>
        </div>

        {NAV_LINKS.map(link => {
          const active = link === 'Logistics';
          return (
            <button key={link} style={{
              padding: '0 15px', height: 54, fontSize: 11.5,
              fontWeight: active ? 700 : 400,
              color: active ? '#e5e7eb' : '#5b6677',
              borderBottom: active ? '2px solid #eab308' : '2px solid transparent',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              {link}
            </button>
          );
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button style={{ fontSize: 11.5, color: '#5b6677', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Sign In
          </button>
          <button style={{
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '8px 16px', border: '1px solid #2a3550', borderRadius: 4, color: '#e5e7eb',
          }}>
            Upload Data
          </button>
        </div>
      </nav>

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Title row ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#5b6677', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Logistics Intelligence System
              </span>
              <span style={{
                fontSize: 9.5, fontWeight: 700, color: '#eab308',
                backgroundColor: '#1c1905', border: '1px solid #5c4a08',
                padding: '2px 8px', borderRadius: 3, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                Sample Data
              </span>
            </div>
            <h1 style={{ fontSize: 27, fontWeight: 800, lineHeight: 1.15, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Kamoa Corridor Flow Map
            </h1>
            <p style={{ fontSize: 12.5, color: '#5b6677', lineHeight: 1.6 }}>
              A working demo of how Sentinel LIS turns fragmented logistics data into corridor
              intelligence: where material is moving, where delays are forming, where cost is
              leaking — and which trips support each metric.
            </p>
          </div>

          {/* Period toggle */}
          <div style={{ display: 'flex', border: '1px solid #1f2937', borderRadius: 6, overflow: 'hidden', flexShrink: 0, marginTop: 4 }}>
            {['week', 'month', 'quarter'].map((p, i) => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '8px 20px', fontSize: 11.5,
                fontWeight: period === p ? 700 : 500,
                color: period === p ? '#0a0f1a' : '#5b6677',
                backgroundColor: period === p ? '#eab308' : 'transparent',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                borderLeft: i ? '1px solid #1f2937' : 'none',
              }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI cards ── */}
        <KPICards kpis={kpis} />

        {/* ── Map + brief ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 390px', gap: 16, alignItems: 'start' }}>

          <div style={{ backgroundColor: '#0d1220', border: '1px solid #1a2236', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #1a2236', backgroundColor: '#0a0f1a' }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '12px 20px', fontSize: 11, fontWeight: activeTab === tab.id ? 700 : 400,
                  color: activeTab === tab.id ? '#eab308' : '#475569',
                  borderBottom: `2px solid ${activeTab === tab.id ? '#eab308' : 'transparent'}`,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: 20 }}>
              {activeTab === 'map' && (
                <CorridorMap routeAnalyses={routeAnalyses} selectedRoute={selectedRoute} onRouteSelect={setSelectedRoute} />
              )}
              {activeTab === 'trends' && (
                <WeeklyTrends route={routeAnalyses[focusRoute]} />
              )}
              {activeTab === 'trips' && (
                <TripEvidence trips={routeTrips} route={routeAnalyses[focusRoute]} />
              )}
            </div>
          </div>

          <IntelligenceBrief
            routeAnalyses={routeAnalyses}
            selectedRoute={selectedRoute}
            onRouteSelect={setSelectedRoute}
            onViewTrips={viewTrips}
          />
        </div>
      </div>
    </div>
  );
}
