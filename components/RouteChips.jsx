const RISK_STYLES = {
  critical: { bg: '#1c0a00', border: '#7c2d12', color: '#f97316', marker: '●' },
  watch:    { bg: '#1c1000', border: '#78350f', color: '#fbbf24', marker: '◑' },
  normal:   { bg: '#0a100a', border: '#14532d', color: '#4ade80', marker: '○' },
};

export default function RouteChips({ routes, routeAnalyses, selected, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: 10, color: '#374151', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 4 }}>
        Routes
      </span>
      {routes.map(routeId => {
        const risk = routeAnalyses[routeId]?.risk ?? 'normal';
        const s = RISK_STYLES[risk];
        const isSelected = routeId === selected;
        return (
          <button
            key={routeId}
            onClick={() => onSelect(routeId)}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              fontSize: 12, fontWeight: 700,
              backgroundColor: isSelected ? '#1c1907' : s.bg,
              border: `2px solid ${isSelected ? '#eab308' : s.border}`,
              color: isSelected ? '#eab308' : s.color,
              display: 'flex', alignItems: 'center', gap: 5,
              letterSpacing: '0.04em',
            }}
          >
            {routeId}
            <span style={{ fontSize: 9, opacity: 0.9 }}>{s.marker}</span>
          </button>
        );
      })}
    </div>
  );
}
