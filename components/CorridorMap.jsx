// Flow diagram corridor map — Lumnia-style horizontal node-edge layout

const NODES = {
  Kasumbalesa:      { x: 90,  y: 60,  label: 'Kasumbalesa' },
  CopperbeltBorder: { x: 320, y: 60,  label: 'Copperbelt Border' },
  DarEsSalaam:      { x: 90,  y: 150, label: 'Dar es Salaam' },
  Lusaka:           { x: 300, y: 150, label: 'Lusaka' },
  Chirundu:         { x: 490, y: 150, label: 'Chirundu' },
  Harare:           { x: 660, y: 150, label: 'Harare' },
  Nacala:           { x: 90,  y: 245, label: 'Nacala' },
  Lilongwe:         { x: 320, y: 245, label: 'Lilongwe' },
  Beira:            { x: 90,  y: 320, label: 'Beira' },
  Blantyre:         { x: 320, y: 320, label: 'Blantyre' },
  Durban:           { x: 90,  y: 395, label: 'Durban' },
  Johannesburg:     { x: 320, y: 395, label: 'Johannesburg' },
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

const RISK_EDGE = {
  critical: { stroke: '#f97316', dash: null,   width: 3.5 },
  watch:    { stroke: '#fbbf24', dash: null,   width: 3 },
  normal:   { stroke: '#2d3748', dash: '7 5',  width: 2 },
};

function curvePath(x1, y1, x2, y2) {
  const dx = (x2 - x1) * 0.45;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
}

function midPoint(x1, y1, x2, y2) {
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
}

export default function CorridorMap({ routeAnalyses, selectedRoute, onRouteSelect }) {
  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 12, alignItems: 'center' }}>
        {[
          { color: '#f97316', dash: false, label: 'Over baseline' },
          { color: '#fbbf24', dash: false, label: 'Above baseline' },
          { color: '#374151', dash: true,  label: 'On baseline' },
          { color: '#eab308', dash: false, label: 'Selected' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="22" height="4">
              <line
                x1="0" y1="2" x2="22" y2="2"
                stroke={item.color}
                strokeWidth="2.5"
                strokeDasharray={item.dash ? '5 3' : undefined}
              />
            </svg>
            <span style={{ fontSize: 11, color: '#6b7280' }}>{item.label}</span>
          </div>
        ))}
      </div>

      <svg viewBox="0 0 720 430" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <rect width="720" height="430" fill="#080d18" rx="6" />

        {/* Subtle horizontal bands */}
        {[60, 150, 245, 320, 395].map(y => (
          <line key={y} x1="30" y1={y} x2="690" y2={y} stroke="#111827" strokeWidth="1" strokeDasharray="3 6" />
        ))}

        {/* Edges */}
        {Object.entries(ROUTE_EDGES).map(([routeId, edge]) => {
          const from = NODES[edge.from];
          const to   = NODES[edge.to];
          const analysis = routeAnalyses[routeId];
          const isSelected = routeId === selectedRoute;
          const risk = analysis?.risk ?? 'normal';
          const cfg = RISK_EDGE[risk];
          const color = isSelected ? '#eab308' : cfg.stroke;
          const sw    = isSelected ? 4.5 : cfg.width;
          const dash  = isSelected ? null : cfg.dash;
          const path  = curvePath(from.x, from.y, to.x, to.y);
          const mid   = midPoint(from.x, from.y, to.x, to.y);

          // Latest-3wk tonnes for edge label
          const last3 = (analysis?.weeklyData ?? []).filter(w => w.week >= 10);
          const tonnes = Math.round(last3.reduce((s, d) => s + (d.totalTonnes ?? 0), 0));

          return (
            <g key={routeId} onClick={() => onRouteSelect(routeId)} style={{ cursor: 'pointer' }}>
              {/* Glow */}
              <path d={path} stroke={color} strokeWidth={sw + 5} strokeOpacity="0.12" fill="none" />
              {/* Main line */}
              <path
                d={path}
                stroke={color}
                strokeWidth={sw}
                strokeDasharray={dash ?? undefined}
                fill="none"
                strokeLinecap="round"
              />
              {/* Tonnes label */}
              <rect x={mid.x - 22} y={mid.y - 9} width="44" height="15" rx="3" fill="#0d1220" />
              <text
                x={mid.x} y={mid.y + 2.5}
                textAnchor="middle" fontSize="9" fill={color} fontWeight="600" fontFamily="monospace"
              >
                {tonnes > 0 ? `${(tonnes / 1000).toFixed(1)}k t` : routeId}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {Object.entries(NODES).map(([name, pos]) => {
          // Which routes touch this node?
          const touchingRoute = Object.entries(ROUTE_EDGES).find(
            ([, e]) => e.from === name || e.to === name
          );
          const rId = touchingRoute?.[0];
          const isSelectedNode = rId === selectedRoute;
          const risk = rId ? (routeAnalyses[rId]?.risk ?? 'normal') : 'normal';
          const nodeColor = isSelectedNode
            ? '#eab308'
            : risk === 'critical' ? '#f97316'
            : risk === 'watch'    ? '#fbbf24'
            : '#374151';

          return (
            <g key={name}>
              {/* Outer glow ring */}
              {isSelectedNode && (
                <circle cx={pos.x} cy={pos.y} r="11" fill="none" stroke="#eab308" strokeWidth="1" strokeOpacity="0.4" />
              )}
              <circle cx={pos.x} cy={pos.y} r="6.5" fill="#0d1220" stroke={nodeColor} strokeWidth="2" />
              <circle cx={pos.x} cy={pos.y} r="2.5" fill={nodeColor} />
              <text
                x={pos.x} y={pos.y + 20}
                textAnchor="middle" fontSize="10" fill="#9ca3af" fontFamily="sans-serif"
              >
                {pos.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
