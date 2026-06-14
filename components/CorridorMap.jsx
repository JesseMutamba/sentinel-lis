// Kamoa Corridor flow map — mine → concentrator → smelter → yard → port/border

const NODES = {
  'Kamoa Mine':    { x: 78,  y: 120, anchor: 'end',    dx: -12, dy: 4  },
  'Kakula Mine':   { x: 78,  y: 300, anchor: 'end',    dx: -12, dy: 4  },
  'Concentrator':  { x: 240, y: 210, anchor: 'middle', dx: 0,   dy: 22 },
  'Smelter':       { x: 385, y: 210, anchor: 'middle', dx: 0,   dy: 22 },
  'Kolwezi Yard':  { x: 525, y: 210, anchor: 'middle', dx: 0,   dy: 22 },
  'Lobito Port':   { x: 648, y: 78,  anchor: 'start',  dx: 12,  dy: 4  },
  'Kasumbalesa':   { x: 648, y: 332, anchor: 'start',  dx: 12,  dy: 4  },
};

// state → edge styling
const EDGE_STYLE = {
  over:   { color: '#f97316', width: 4,   dash: null },   // over baseline (critical)
  above:  { color: '#ca8a04', width: 3,   dash: null },   // above baseline
  on:     { color: '#2f7d6e', width: 2.5, dash: null },   // on baseline
  nocost: { color: '#4b5563', width: 2,   dash: '7 5' },  // no cost data
};

function curve(from, to, bend = 0) {
  // cubic bezier; bend lifts/drops the control points for the port/border legs
  const mx = (from.x + to.x) / 2;
  const c1x = mx, c1y = from.y - bend;
  const c2x = mx, c2y = to.y + bend;
  return {
    d: `M ${from.x} ${from.y} C ${c1x} ${c1y} ${c2x} ${c2y} ${to.x} ${to.y}`,
    mid: { x: mx, y: (from.y + to.y) / 2 - bend * 0.25 },
  };
}

export default function CorridorMap({ routeAnalyses, selectedRoute, onRouteSelect }) {
  const edges = Object.values(routeAnalyses).map(r => {
    const from = NODES[r.from];
    const to = NODES[r.to];
    const bend = r.id === 'R5' ? 36 : r.id === 'R6' ? -36 : 0;
    const geom = curve(from, to, bend);
    return { route: r, from, to, geom };
  });

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        {[
          { color: '#f97316', dash: false, label: 'Over baseline' },
          { color: '#ca8a04', dash: false, label: 'Above baseline' },
          { color: '#2f7d6e', dash: false, label: 'On baseline' },
          { color: '#4b5563', dash: true,  label: 'No cost data' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="22" height="4">
              <line x1="0" y1="2" x2="22" y2="2" stroke={item.color} strokeWidth="2.5"
                strokeDasharray={item.dash ? '5 3' : undefined} />
            </svg>
            <span style={{ fontSize: 11, color: '#6b7280' }}>{item.label}</span>
          </div>
        ))}
      </div>

      <svg viewBox="0 0 720 400" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <rect width="720" height="400" fill="#080d18" rx="6" />

        {/* Edges */}
        {edges.map(({ route, geom }) => {
          const style = EDGE_STYLE[route.state] ?? EDGE_STYLE.on;
          const isSelected = route.id === selectedRoute;
          const width = isSelected ? style.width + 1.5 : style.width;

          return (
            <g key={route.id} onClick={() => onRouteSelect(route.id)} style={{ cursor: 'pointer' }}>
              {/* selection halo */}
              {isSelected && (
                <path d={geom.d} stroke="#eab308" strokeWidth={width + 7} strokeOpacity="0.18"
                  fill="none" strokeLinecap="round" />
              )}
              {/* glow */}
              <path d={geom.d} stroke={style.color} strokeWidth={width + 4} strokeOpacity="0.12"
                fill="none" strokeLinecap="round" />
              {/* main */}
              <path d={geom.d} stroke={style.color} strokeWidth={width}
                strokeDasharray={style.dash ?? undefined} fill="none" strokeLinecap="round" />

              {/* mid waypoint marker on the critical export leg */}
              {route.state === 'over' && (
                <circle cx={geom.mid.x} cy={geom.mid.y} r="4" fill="#080d18" stroke={style.color} strokeWidth="2" />
              )}

              {/* tonnes label */}
              <g>
                <rect x={geom.mid.x - 24} y={geom.mid.y - (route.state === 'over' ? 24 : 9)}
                  width="48" height="15" rx="3" fill="#0d1220" />
                <text x={geom.mid.x} y={geom.mid.y - (route.state === 'over' ? 13.5 : 1.5)}
                  textAnchor="middle" fontSize="9.5"
                  fill={isSelected ? '#eab308' : style.color} fontWeight="600" fontFamily="monospace">
                  {route.tonnes.toLocaleString()} t
                </text>
              </g>
            </g>
          );
        })}

        {/* Nodes */}
        {Object.entries(NODES).map(([name, pos]) => {
          // node tone follows the worst route touching it
          const touching = Object.values(routeAnalyses).filter(r => r.from === name || r.to === name);
          const worst = touching.reduce((acc, r) => {
            const rank = { over: 4, above: 3, nocost: 2, on: 1 };
            return rank[r.state] > rank[acc] ? r.state : acc;
          }, 'on');
          const selectedHere = touching.some(r => r.id === selectedRoute);
          const tone = EDGE_STYLE[worst]?.color ?? '#2f7d6e';
          const ring = selectedHere ? '#eab308' : tone;

          return (
            <g key={name}>
              {selectedHere && (
                <circle cx={pos.x} cy={pos.y} r="11" fill="none" stroke="#eab308" strokeWidth="1" strokeOpacity="0.4" />
              )}
              <circle cx={pos.x} cy={pos.y} r="6.5" fill="#0d1220" stroke={ring} strokeWidth="2" />
              <circle cx={pos.x} cy={pos.y} r="2.5" fill={ring} />
              <text x={pos.x + pos.dx} y={pos.y + pos.dy} textAnchor={pos.anchor}
                fontSize="11" fill="#cbd5e1" fontFamily="sans-serif" fontWeight="500">
                {name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
