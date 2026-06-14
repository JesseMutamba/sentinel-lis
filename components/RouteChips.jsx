'use client';

import { THEME } from '@/lib/theme';

const RISK = {
  critical: { color: THEME.critical, bg: '#1d0d07', border: '#5e271a', marker: '●' },
  watch:    { color: THEME.watch,    bg: '#1c1606', border: THEME.goldDeep, marker: '◑' },
  normal:   { color: THEME.normal,   bg: '#101a0c', border: THEME.greenDeep, marker: '○' },
};

export default function RouteChips({ routes, routeAnalyses, selected, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: 10, color: THEME.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 4 }}>
        Routes
      </span>
      {routes.map(routeId => {
        const risk = routeAnalyses[routeId]?.risk ?? 'normal';
        const s = RISK[risk];
        const isSelected = routeId === selected;
        return (
          <button key={routeId} onClick={() => onSelect(routeId)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            backgroundColor: isSelected ? '#1c1606' : s.bg,
            border: `2px solid ${isSelected ? THEME.selected : s.border}`,
            color: isSelected ? THEME.selected : s.color,
            display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.04em',
          }}>
            {routeId}<span style={{ fontSize: 9, opacity: 0.9 }}>{s.marker}</span>
          </button>
        );
      })}
    </div>
  );
}
