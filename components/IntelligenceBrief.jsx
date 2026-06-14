const RISK_BADGE = {
  critical: { label: 'Critical', color: '#f97316', bg: '#1c0a00', border: '#7c2d12' },
  watch:    { label: 'Watch',    color: '#fbbf24', bg: '#1c1000', border: '#78350f' },
};

function buildHeadline(ra, routeId) {
  if (ra.risk === 'critical') {
    return `${ra.origin} → ${ra.dest} created $${Math.round(ra.avoidableCost).toLocaleString()} of avoidable cost this period`;
  }
  const pct = ra.drift > 0 ? `${Math.round((ra.drift / ra.baselineTransit) * 100)}%` : 'elevated';
  return `${ra.origin} → ${ra.dest} transit is drifting ${pct} over plan`;
}

function buildDetail(ra) {
  if (ra.risk === 'critical') {
    return `Actual $${ra.latestAvgCPT.toFixed(0)}/t vs $${ra.baselineCPT}/t baseline. Signal confirmed Week ${ra.signalWeek}, cost blowout Week ${ra.blowoutWeek}. Highest-value intervention in the corridor.`;
  }
  return `Average transit ${(ra.baselineTransit + ra.drift).toFixed(1)} h vs ${ra.baselineTransit} h planned. Route cost data is not yet above blowout — delay is the early signal here.`;
}

function buildTrendLine(ra) {
  const pct = ra.drift > 0
    ? `Transit time up ${Math.round((ra.drift / ra.baselineTransit) * 100)}% vs prior period`
    : 'Transit time within prior period range';
  return pct;
}

function BriefCard({ ra, routeId, onViewTrips, onRouteSelect }) {
  const cfg = RISK_BADGE[ra.risk];
  if (!cfg) return null;

  return (
    <div
      style={{
        border: `1px solid ${cfg.border}`,
        borderRadius: 6,
        padding: '14px 16px',
        backgroundColor: cfg.bg,
        cursor: 'pointer',
      }}
      onClick={() => onRouteSelect(routeId)}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, color: cfg.color,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>
          {cfg.label}
        </span>
        <span style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {ra.origin} → {ra.dest}
        </span>
      </div>

      {/* Headline */}
      <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', lineHeight: 1.35, marginBottom: 8 }}>
        {buildHeadline(ra, routeId)}
      </div>

      {/* Detail */}
      <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.55, marginBottom: 10 }}>
        {buildDetail(ra)}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#4b5563' }}>{buildTrendLine(ra)}</span>
        <button
          onClick={e => { e.stopPropagation(); onViewTrips(routeId); }}
          style={{
            fontSize: 11, fontWeight: 700, color: cfg.color,
            letterSpacing: '0.05em',
            padding: '3px 0',
            borderBottom: `1px solid ${cfg.color}`,
          }}
        >
          View trips →
        </button>
      </div>
    </div>
  );
}

export default function IntelligenceBrief({ alertRoutes, routeAnalyses, selectedRoute, onRouteSelect, onViewTrips }) {
  const normalRoutes = Object.entries(routeAnalyses).filter(([, r]) => r.risk === 'normal');

  return (
    <div style={{
      backgroundColor: '#0d1220',
      border: '1px solid #1a2236',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #1a2236',
        fontSize: 10, fontWeight: 700, color: '#4b5563',
        textTransform: 'uppercase', letterSpacing: '0.12em',
        backgroundColor: '#0a0f1a',
      }}>
        Corridor Intelligence Brief
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Alert cards */}
        {alertRoutes.map(ra => (
          <BriefCard
            key={ra.routeId}
            ra={ra}
            routeId={ra.routeId}
            onViewTrips={onViewTrips}
            onRouteSelect={onRouteSelect}
          />
        ))}

        {alertRoutes.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: '#374151' }}>
            All corridors operating within normal parameters.
          </div>
        )}

        {/* On-baseline routes summary */}
        {normalRoutes.length > 0 && (
          <div style={{
            borderTop: '1px solid #1a2236',
            paddingTop: 12,
            marginTop: 4,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              On Baseline
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {normalRoutes.map(([rId, ra]) => (
                <button
                  key={rId}
                  onClick={() => onRouteSelect(rId)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: 5,
                    backgroundColor: selectedRoute === rId ? '#0f1a0f' : 'transparent',
                    border: `1px solid ${selectedRoute === rId ? '#14532d' : '#1a2236'}`,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', marginRight: 8 }}>●</span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{ra.origin} → {ra.dest}</span>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#374151' }}>{rId}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
