'use client';

import { useState } from 'react';
import { THEME } from '@/lib/theme';

const VW = 720, VH = 430;

const NODES = {
  Kasumbalesa:      { x: 95,  y: 64,  label: 'Kasumbalesa' },
  CopperbeltBorder: { x: 330, y: 64,  label: 'Copperbelt Border' },
  DarEsSalaam:      { x: 95,  y: 158, label: 'Dar es Salaam' },
  Lusaka:           { x: 305, y: 158, label: 'Lusaka' },
  Chirundu:         { x: 495, y: 158, label: 'Chirundu' },
  Harare:           { x: 655, y: 158, label: 'Harare' },
  Nacala:           { x: 95,  y: 250, label: 'Nacala' },
  Lilongwe:         { x: 330, y: 250, label: 'Lilongwe' },
  Beira:            { x: 95,  y: 330, label: 'Beira' },
  Blantyre:         { x: 330, y: 330, label: 'Blantyre' },
  Durban:           { x: 95,  y: 400, label: 'Durban' },
  Johannesburg:     { x: 330, y: 400, label: 'Johannesburg' },
};

const ROUTE_EDGES = {
  R3: { from: 'Kasumbalesa',  to: 'CopperbeltBorder' },
  R5: { from: 'DarEsSalaam',  to: 'Lusaka' },
  R1: { from: 'Lusaka',       to: 'Chirundu' },
  R2: { from: 'Chirundu',     to: 'Harare' },
  R6: { from: 'Nacala',       to: 'Lilongwe' },
  R4: { from: 'Beira',        to: 'Blantyre' },
  R7: { from: 'Durban',       to: 'Johannesburg' },
};

const RISK = {
  critical: { color: THEME.critical, label: 'Critical' },
  watch:    { color: THEME.watch,    label: 'Watch' },
  normal:   { color: THEME.normal,   label: 'Normal' },
};

function edgePath(a, b) {
  const dx = (b.x - a.x) * 0.4;
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`;
}

function fmtTonnes(t) {
  if (!t) return '—';
  return t >= 1000 ? `${(t / 1000).toFixed(1)}k t` : `${Math.round(t)} t`;
}

export default function CorridorMap({ routeAnalyses, routeTonnes = {}, selectedRoute, onRouteSelect }) {
  const [hovered, setHovered] = useState(null);

  const edges = Object.entries(ROUTE_EDGES).map(([id, e]) => {
    const a = NODES[e.from], b = NODES[e.to];
    return { id, a, b, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, analysis: routeAnalyses[id] };
  });

  const active = hovered ?? selectedRoute;
  const tip = active ? edges.find(e => e.id === active) : null;
  const tipRoute = tip?.analysis;

  return (
    <div>
      {/* Header + legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 11, color: THEME.muted }}>
          Click a route to inspect · hover for detail
        </span>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {[
            { color: RISK.critical.color, label: 'Critical' },
            { color: RISK.watch.color,    label: 'Watch' },
            { color: RISK.normal.color,   label: 'Normal' },
            { color: THEME.selected,      label: 'Selected' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: 9, backgroundColor: item.color, display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: THEME.muted }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <rect width={VW} height={VH} fill={THEME.panelDark} rx="8" />

          {/* faint lane guides */}
          {[64, 158, 250, 330, 400].map(y => (
            <line key={y} x1="40" y1={y} x2={VW - 40} y2={y} stroke="#0f1828" strokeWidth="1" />
          ))}

          {/* Edges */}
          {edges.map(({ id, a, b, analysis }) => {
            const risk = analysis?.risk ?? 'normal';
            const isSel = id === selectedRoute;
            const isHov = id === hovered;
            const baseColor = RISK[risk]?.color ?? RISK.normal.color;
            const color = isSel ? THEME.selected : baseColor;
            const w = isSel ? 5 : isHov ? 4 : risk === 'normal' ? 2.5 : 3.2;
            const path = edgePath(a, b);
            const dash = risk === 'normal' && !isSel ? '8 6' : undefined;

            return (
              <g key={id}
                 onClick={() => onRouteSelect(id)}
                 onMouseEnter={() => setHovered(id)}
                 onMouseLeave={() => setHovered(null)}
                 style={{ cursor: 'pointer' }}>
                {/* wide invisible hit area */}
                <path d={path} stroke="transparent" strokeWidth="22" fill="none" />
                {/* glow */}
                <path d={path} stroke={color} strokeWidth={w + 6} strokeOpacity={isSel || isHov ? 0.22 : 0.1}
                  fill="none" strokeLinecap="round" />
                {/* main */}
                <path d={path} stroke={color} strokeWidth={w} strokeDasharray={dash}
                  fill="none" strokeLinecap="round" />
              </g>
            );
          })}

          {/* Edge route badges */}
          {edges.map(({ id, mid, analysis }) => {
            const risk = analysis?.risk ?? 'normal';
            const isSel = id === selectedRoute;
            const isHov = id === hovered;
            const color = isSel ? THEME.selected : (RISK[risk]?.color ?? RISK.normal.color);
            return (
              <g key={`b-${id}`}
                 onClick={() => onRouteSelect(id)}
                 onMouseEnter={() => setHovered(id)}
                 onMouseLeave={() => setHovered(null)}
                 style={{ cursor: 'pointer' }}>
                <rect x={mid.x - 15} y={mid.y - 11} width="30" height="18" rx="9"
                  fill={THEME.panel} stroke={color} strokeWidth={isSel || isHov ? 1.6 : 1} />
                <text x={mid.x} y={mid.y + 2.5} textAnchor="middle" fontSize="10"
                  fontWeight="700" fill={color} fontFamily="monospace">{id}</text>
              </g>
            );
          })}

          {/* Nodes */}
          {Object.entries(NODES).map(([name, pos]) => {
            const touching = Object.entries(ROUTE_EDGES).find(([, e]) => e.from === name || e.to === name);
            const rId = touching?.[0];
            const risk = rId ? (routeAnalyses[rId]?.risk ?? 'normal') : 'normal';
            const isOnActive = rId && (rId === selectedRoute || rId === hovered);
            const color = isOnActive
              ? (rId === selectedRoute ? THEME.selected : (RISK[risk]?.color ?? RISK.normal.color))
              : '#4a4636';

            return (
              <g key={name}>
                {isOnActive && (
                  <circle cx={pos.x} cy={pos.y} r="11" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
                )}
                <circle cx={pos.x} cy={pos.y} r="6" fill={THEME.panel} stroke={color} strokeWidth="2" />
                <circle cx={pos.x} cy={pos.y} r="2.4" fill={color} />
                <text x={pos.x + 12} y={pos.y + 4} fontSize="10.5"
                  fill={isOnActive ? THEME.text : THEME.textDim} fontFamily="sans-serif" fontWeight="500">
                  {pos.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / selection tooltip */}
        {tip && tipRoute && (
          <div style={{
            position: 'absolute',
            left: `${(tip.mid.x / VW) * 100}%`,
            top: `${(tip.mid.y / VH) * 100}%`,
            transform: 'translate(-50%, -120%)',
            pointerEvents: 'none',
            backgroundColor: THEME.panel,
            border: `1px solid ${RISK[tipRoute.risk]?.color ?? THEME.border}`,
            borderRadius: 8,
            padding: '10px 12px',
            minWidth: 190,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 5,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: THEME.text, fontFamily: 'monospace' }}>{tip.id}</span>
              <span style={{
                fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: RISK[tipRoute.risk]?.color, padding: '1px 7px', borderRadius: 4,
                border: `1px solid ${RISK[tipRoute.risk]?.color}`,
              }}>
                {RISK[tipRoute.risk]?.label}
              </span>
            </div>
            <div style={{ fontSize: 11, color: THEME.textDim, marginBottom: 8 }}>
              {tipRoute.origin} → {tipRoute.dest}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11 }}>
              <span style={{ color: THEME.faint }}>Tonnes</span>
              <span style={{ color: THEME.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtTonnes(routeTonnes[tip.id])}</span>
              <span style={{ color: THEME.faint }}>Avg CPT</span>
              <span style={{ color: THEME.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${tipRoute.latestAvgCPT.toFixed(2)}/t</span>
              <span style={{ color: THEME.faint }}>Delay</span>
              <span style={{ color: THEME.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {tipRoute.latestRollingDelay == null ? '—' : `+${tipRoute.latestRollingDelay.toFixed(1)}h`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
