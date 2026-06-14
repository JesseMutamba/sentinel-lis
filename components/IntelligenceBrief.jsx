const BADGE = {
  critical: { label: 'Critical', color: '#f97316', border: '#7c2d12', bg: '#1a0a02' },
  watch:    { label: 'Watch',    color: '#eab308', border: '#78580a', bg: '#161200' },
  hot:      { label: 'Above baseline', color: '#ca8a04', border: '#5c4504', bg: '#12100a' },
  normal:   { label: 'On baseline', color: '#34d399', border: '#134e35', bg: '#06140e' },
};

function fmt(n) {
  return Math.round(n).toLocaleString();
}

function headline(r) {
  if (r.risk === 'critical') {
    return `${r.from} → ${r.to} created $${fmt(r.avoidable)} of avoidable cost this period`;
  }
  if (r.risk === 'watch') {
    return `${r.from} → ${r.to} transit is drifting ${Math.round(r.driftPct)}% over plan`;
  }
  if (r.risk === 'hot') {
    return `${r.from} → ${r.to} is running $${fmt(r.avoidable)} above baseline`;
  }
  return `${r.from} → ${r.to} is tracking on baseline`;
}

function detail(r) {
  if (r.risk === 'critical') {
    return `Actual $${r.actualCPT}/t vs $${r.baselineCPT}/t baseline across ${r.tonnes.toLocaleString()} t — ${r.sharePct}% of network avoidable cost. Highest-value intervention in the corridor.`;
  }
  if (r.risk === 'watch') {
    return `Average transit ${r.actualTransit} h vs ${r.plannedTransit} h planned. Route cost data is not yet available — delay is the early signal here.`;
  }
  if (r.risk === 'hot') {
    return `Actual $${r.actualCPT}/t vs $${r.baselineCPT}/t baseline across ${r.tonnes.toLocaleString()} t. Within tolerance, but trending up — keep under watch.`;
  }
  return `Cost and transit both within baseline tolerance across ${r.tonnes.toLocaleString()} t.`;
}

function BriefCard({ r, selected, onSelect, onViewTrips }) {
  const cfg = BADGE[r.risk] ?? BADGE.normal;
  return (
    <div
      onClick={() => onSelect(r.id)}
      style={{
        border: `1px solid ${selected ? '#eab308' : cfg.border}`,
        borderRadius: 7,
        padding: '14px 16px',
        backgroundColor: cfg.bg,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {cfg.label}
        </span>
        <span style={{ fontSize: 9.5, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {r.from} → {r.to}
        </span>
      </div>

      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#e5e7eb', lineHeight: 1.35, marginBottom: 8 }}>
        {headline(r)}
      </div>

      <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.55, marginBottom: 11 }}>
        {detail(r)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#475569' }}>
          Transit time up {r.transitTrendPct.toFixed(1)}% vs prior period
        </span>
        <button
          onClick={e => { e.stopPropagation(); onViewTrips(r.id); }}
          style={{ fontSize: 11, fontWeight: 700, color: cfg.color, borderBottom: `1px solid ${cfg.color}`, padding: '2px 0' }}
        >
          View trips →
        </button>
      </div>
    </div>
  );
}

export default function IntelligenceBrief({ routeAnalyses, selectedRoute, onRouteSelect, onViewTrips }) {
  const rank = { critical: 0, watch: 1, hot: 2, normal: 3 };
  const routes = Object.values(routeAnalyses).sort((a, b) => rank[a.risk] - rank[b.risk]);

  const featured = routes.filter(r => r.risk === 'critical' || r.risk === 'watch');
  const rest = routes.filter(r => r.risk === 'hot' || r.risk === 'normal');

  return (
    <div style={{ backgroundColor: '#0d1220', border: '1px solid #1a2236', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #1a2236',
        fontSize: 10, fontWeight: 700, color: '#4b5563',
        textTransform: 'uppercase', letterSpacing: '0.12em', backgroundColor: '#0a0f1a',
      }}>
        Corridor Intelligence Brief
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {featured.map(r => (
          <BriefCard
            key={r.id} r={r}
            selected={r.id === selectedRoute}
            onSelect={onRouteSelect}
            onViewTrips={onViewTrips}
          />
        ))}

        {rest.length > 0 && (
          <div style={{ borderTop: '1px solid #1a2236', paddingTop: 12, marginTop: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Other Segments
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rest.map(r => {
                const cfg = BADGE[r.risk] ?? BADGE.normal;
                const sel = r.id === selectedRoute;
                return (
                  <button key={r.id} onClick={() => onRouteSelect(r.id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', borderRadius: 5, textAlign: 'left', cursor: 'pointer',
                      backgroundColor: sel ? '#11161f' : 'transparent',
                      border: `1px solid ${sel ? '#eab308' : '#1a2236'}`,
                    }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: cfg.color, fontSize: 10 }}>●</span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{r.from} → {r.to}</span>
                    </span>
                    <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: '#475569' }}>
                      {r.costData ? `$${r.actualCPT}/t` : 'no cost'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
