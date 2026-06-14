const RISK_STYLES = {
  critical: { bg: '#450a0a', border: '#7f1d1d', color: '#f87171', marker: '●' },
  watch:    { bg: '#451a03', border: '#78350f', color: '#fbbf24', marker: '◑' },
  normal:   { bg: '#052e16', border: '#14532d', color: '#4ade80', marker: '○' },
};

export default function RouteChips({ routes, routeAnalyses, selected, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>
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
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: isSelected ? '#1c1917' : s.bg,
              border: `2px solid ${isSelected ? '#eab308' : s.border}`,
              color: isSelected ? '#eab308' : s.color,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            {routeId}
            <span style={{ fontSize: 9, opacity: 0.8 }}>{s.marker}</span>
          </button>
        );
      })}
    </div>
  );
}
