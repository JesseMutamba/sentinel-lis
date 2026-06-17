'use client';

import { useState, useMemo } from 'react';
import { useTheme } from '@/lib/theme';

const COL_GAP = 210, ROW_GAP = 64, MX = 96, MY = 44;

function fmtTonnes(t) {
  if (!t) return '—';
  return t >= 1000 ? `${(t / 1000).toFixed(1)}k t` : `${Math.round(t)} t`;
}

function layout(routeAnalyses) {
  const segs = Object.values(routeAnalyses).filter(r => r.origin && r.dest);
  const nodes = new Set();
  const edges = [];
  for (const r of segs) {
    nodes.add(r.origin); nodes.add(r.dest);
    edges.push({ code: r.routeId, from: r.origin, to: r.dest, risk: r.risk });
  }
  const list = [...nodes];

  // longest-path depth (bounded relaxation → handles DAGs, caps any cycle)
  const depth = {}; list.forEach(n => (depth[n] = 0));
  for (let i = 0; i < list.length; i++) {
    let changed = false;
    for (const e of edges) if (depth[e.to] < depth[e.from] + 1) { depth[e.to] = depth[e.from] + 1; changed = true; }
    if (!changed) break;
  }

  const byCol = {};
  for (const n of list) (byCol[depth[n]] ||= []).push(n);
  Object.values(byCol).forEach(col => col.sort());
  const maxCol = Math.max(...Object.values(byCol).map(c => c.length));
  const maxDepth = Math.max(...list.map(n => depth[n]));

  const pos = {};
  for (const [d, col] of Object.entries(byCol)) {
    const dn = Number(d);
    const offset = (maxCol - col.length) / 2; // vertically center each column
    col.forEach((n, i) => { pos[n] = { x: MX + dn * COL_GAP, y: MY + (i + offset) * ROW_GAP }; });
  }

  const W = MX * 2 + maxDepth * COL_GAP;
  const H = MY * 2 + (maxCol - 1) * ROW_GAP;
  return { pos, edges, W, H };
}

function curve(a, b) {
  const dx = Math.max(40, (b.x - a.x) * 0.45);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`;
}

export default function CorridorMap({ routeAnalyses, routeTonnes = {}, selectedRoute, onRouteSelect }) {
  const THEME = useTheme();
  const RISK = {
    critical: { color: THEME.critical, label: 'Critical' },
    watch:    { color: THEME.watch,    label: 'Watch' },
    normal:   { color: THEME.normal,   label: 'Normal' },
  };
  const [hovered, setHovered] = useState(null);
  const { pos, edges, W, H } = useMemo(() => layout(routeAnalyses), [routeAnalyses]);

  const active = hovered ?? selectedRoute;
  const tipRoute = active ? routeAnalyses[active] : null;
  const tipEdge = tipRoute ? edges.find(e => e.code === active) : null;
  const tipMid = tipEdge ? { x: (pos[tipEdge.from].x + pos[tipEdge.to].x) / 2, y: (pos[tipEdge.from].y + pos[tipEdge.to].y) / 2 } : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 11, color: THEME.muted }}>Click a segment to inspect · hover for detail</span>
        <div style={{ display: 'flex', gap: 16 }}>
          {[['critical', 'Critical'], ['watch', 'Watch'], ['normal', 'Normal'], ['sel', 'Selected']].map(([k, label]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: 9, backgroundColor: k === 'sel' ? THEME.selected : RISK[k].color, display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: THEME.muted }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <rect width={W} height={H} fill={THEME.panelDark} rx="8" />

          {/* edges */}
          {edges.map(e => {
            const a = pos[e.from], b = pos[e.to];
            const isSel = e.code === selectedRoute, isHov = e.code === hovered;
            const color = isSel ? THEME.selected : RISK[e.risk].color;
            const w = isSel ? 4.5 : isHov ? 3.6 : e.risk === 'normal' ? 2 : 3;
            const dash = e.risk === 'normal' && !isSel ? '7 6' : undefined;
            const d = curve(a, b);
            return (
              <g key={e.code} onClick={() => onRouteSelect(e.code)} onMouseEnter={() => setHovered(e.code)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
                <path d={d} stroke="transparent" strokeWidth="20" fill="none" />
                <path d={d} stroke={color} strokeWidth={w + 5} strokeOpacity={isSel || isHov ? 0.2 : 0.08} fill="none" strokeLinecap="round" />
                <path d={d} stroke={color} strokeWidth={w} strokeDasharray={dash} fill="none" strokeLinecap="round" />
              </g>
            );
          })}

          {/* nodes */}
          {Object.entries(pos).map(([name, p]) => {
            const touching = edges.filter(e => e.from === name || e.to === name);
            const onActive = touching.some(e => e.code === selectedRoute || e.code === hovered);
            const worst = touching.reduce((acc, e) => ({ critical: 3, watch: 2, normal: 1 }[e.risk] > { critical: 3, watch: 2, normal: 1 }[acc] ? e.risk : acc), 'normal');
            const sel = touching.some(e => e.code === selectedRoute);
            const color = sel ? THEME.selected : onActive ? RISK[worst].color : THEME.nodeDim;
            return (
              <g key={name}>
                {onActive && <circle cx={p.x} cy={p.y} r="10" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.5" />}
                <circle cx={p.x} cy={p.y} r="5.5" fill={THEME.panel} stroke={color} strokeWidth="2" />
                <circle cx={p.x} cy={p.y} r="2.2" fill={color} />
                <text x={p.x} y={p.y + 16} textAnchor="middle" fontSize="9" fill={onActive ? THEME.text : THEME.textDim} fontFamily="sans-serif">{name}</text>
              </g>
            );
          })}
        </svg>

        {tipRoute && tipMid && (
          <div style={{
            position: 'absolute', left: `${(tipMid.x / W) * 100}%`, top: `${(tipMid.y / H) * 100}%`,
            transform: 'translate(-50%, -118%)', pointerEvents: 'none',
            backgroundColor: THEME.panel, border: `1px solid ${RISK[tipRoute.risk].color}`, borderRadius: 8,
            padding: '10px 12px', minWidth: 200, boxShadow: '0 10px 28px rgba(0,0,0,0.6)', zIndex: 5,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: THEME.text }}>{tipRoute.segment}</span>
              <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: RISK[tipRoute.risk].color, border: `1px solid ${RISK[tipRoute.risk].color}`, borderRadius: 4, padding: '1px 6px' }}>
                {RISK[tipRoute.risk].label}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3px 12px', fontSize: 11 }}>
              <span style={{ color: THEME.faint }}>Tonnes</span><span style={{ color: THEME.text, textAlign: 'right' }}>{fmtTonnes(routeTonnes[tipRoute.routeId])}</span>
              <span style={{ color: THEME.faint }}>CPT</span><span style={{ color: THEME.text, textAlign: 'right' }}>${tipRoute.actualCostPerTonne.toFixed(0)}/t vs ${tipRoute.baselineCPT}</span>
              <span style={{ color: THEME.faint }}>Delay drift</span><span style={{ color: THEME.text, textAlign: 'right' }}>+{tipRoute.delayDriftHours.toFixed(1)}h</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
