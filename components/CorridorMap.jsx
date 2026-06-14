const NODES = {
  Kasumbalesa:      { x: 210, y: 195, label: 'Kasumbalesa' },
  CopperbeltBorder: { x: 185, y: 148, label: 'Copperbelt Border' },
  Lusaka:           { x: 295, y: 268, label: 'Lusaka' },
  Chirundu:         { x: 345, y: 322, label: 'Chirundu' },
  Harare:           { x: 445, y: 296, label: 'Harare' },
  Beira:            { x: 510, y: 315, label: 'Beira' },
  Blantyre:         { x: 475, y: 268, label: 'Blantyre' },
  DarEsSalaam:      { x: 568, y: 128, label: 'Dar es Salaam' },
  Nacala:           { x: 545, y: 222, label: 'Nacala' },
  Lilongwe:         { x: 458, y: 212, label: 'Lilongwe' },
  Durban:           { x: 458, y: 445, label: 'Durban' },
  Johannesburg:     { x: 345, y: 398, label: 'Johannesburg' },
};

const ROUTE_EDGES = {
  R1: { from: 'Lusaka', to: 'Chirundu' },
  R2: { from: 'Chirundu', to: 'Harare' },
  R3: { from: 'Kasumbalesa', to: 'CopperbeltBorder' },
  R4: { from: 'Beira', to: 'Blantyre' },
  R5: { from: 'DarEsSalaam', to: 'Lusaka' },
  R6: { from: 'Nacala', to: 'Lilongwe' },
  R7: { from: 'Durban', to: 'Johannesburg' },
};

const RISK_COLORS = { critical: '#ef4444', watch: '#f59e0b', normal: '#22c55e' };

function arrowHead(x1, y1, x2, y2, color) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const tipX = x2 - 7 * Math.cos(angle);
  const tipY = y2 - 7 * Math.sin(angle);
  const lx = tipX - 10 * Math.cos(angle - 0.4);
  const ly = tipY - 10 * Math.sin(angle - 0.4);
  const rx = tipX - 10 * Math.cos(angle + 0.4);
  const ry = tipY - 10 * Math.sin(angle + 0.4);
  return `M ${lx} ${ly} L ${tipX} ${tipY} L ${rx} ${ry}`;
}

export default function CorridorMap({ routeAnalyses, selectedRoute, onRouteSelect }) {
  return (
    <svg
      viewBox="0 0 640 490"
      style={{ width: '100%', height: 'auto', maxHeight: 460, display: 'block' }}
    >
      <rect width="640" height="490" fill="#0d1526" rx="6" />

      {/* Subtle grid */}
      {[80, 160, 240, 320, 400].map(y => (
        <line key={`h${y}`} x1="0" y1={y} x2="640" y2={y} stroke="#161e2e" strokeWidth="1" />
      ))}
      {[80, 160, 240, 320, 400, 480, 560].map(x => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="490" stroke="#161e2e" strokeWidth="1" />
      ))}

      {/* Route edges */}
      {Object.entries(ROUTE_EDGES).map(([routeId, edge]) => {
        const from = NODES[edge.from];
        const to = NODES[edge.to];
        const analysis = routeAnalyses[routeId];
        const isSelected = routeId === selectedRoute;
        const color = isSelected ? '#eab308' : (RISK_COLORS[analysis?.risk] ?? '#22c55e');
        const sw = isSelected ? 4.5 : 3;
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;

        return (
          <g key={routeId} onClick={() => onRouteSelect(routeId)} style={{ cursor: 'pointer' }}>
            {/* Glow halo */}
            <line
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={color} strokeWidth={sw + 6} strokeOpacity="0.15" strokeLinecap="round"
            />
            <line
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={color} strokeWidth={sw} strokeLinecap="round"
            />
            {/* Arrow */}
            <path d={arrowHead(from.x, from.y, to.x, to.y, color)} stroke={color} strokeWidth="1.5" fill="none" />
            {/* Route chip */}
            <rect x={mx - 13} y={my - 10} width="26" height="17" rx="4" fill="#111827" stroke={color} strokeWidth="1.2" />
            <text
              x={mx} y={my + 2.5}
              textAnchor="middle" fontSize="9.5" fontWeight="700"
              fill={color} fontFamily="monospace"
            >
              {routeId}
            </text>
          </g>
        );
      })}

      {/* City nodes */}
      {Object.entries(NODES).map(([name, pos]) => (
        <g key={name}>
          <circle cx={pos.x} cy={pos.y} r="6" fill="#1f2937" stroke="#4b5563" strokeWidth="1.5" />
          <circle cx={pos.x} cy={pos.y} r="2.5" fill="#9ca3af" />
          <text
            x={pos.x + 9} y={pos.y + 4}
            fontSize="9" fill="#9ca3af" fontFamily="sans-serif"
          >
            {pos.label}
          </text>
        </g>
      ))}

      {/* Legend */}
      <g transform="translate(10, 418)">
        <rect x="0" y="0" width="120" height="66" rx="5" fill="#111827" stroke="#1f2937" strokeWidth="1" />
        {[
          { color: '#ef4444', label: 'Critical' },
          { color: '#f59e0b', label: 'Watch' },
          { color: '#22c55e', label: 'Normal' },
          { color: '#eab308', label: 'Selected' },
        ].map((item, i) => (
          <g key={item.label} transform={`translate(10, ${13 + i * 13})`}>
            <line x1="0" y1="0" x2="18" y2="0" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" />
            <text x="25" y="4" fontSize="9.5" fill="#9ca3af" fontFamily="sans-serif">{item.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
