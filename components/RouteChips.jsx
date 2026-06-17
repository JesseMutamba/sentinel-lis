'use client';

import { useTheme } from '@/lib/theme';

export default function RouteChips({ routes, routeAnalyses, selected, onSelect }) {
  const THEME = useTheme();
  const RISK = {
    critical: { color: THEME.critical, bg: THEME.critBg, border: THEME.critBorder, marker: '●' },
    watch:    { color: THEME.watch,    bg: THEME.watchBg, border: THEME.watchBorder, marker: '◑' },
    normal:   { color: THEME.normal,   bg: THEME.normBg, border: THEME.normBorder, marker: '○' },
  };

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
            backgroundColor: isSelected ? THEME.accentSoft : s.bg,
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
