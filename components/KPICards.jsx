function fmtTonnes(n) {
  return `${n.toLocaleString()} t`;
}

export default function KPICards({ kpis }) {
  const cards = [
    {
      label: 'Avoidable Cost',
      value: `$${Math.round(kpis.avoidableCost).toLocaleString()}`,
      sub: 'Cost above a clean baseline this period — derived from validated trip cost data',
      trend: kpis.avoidableTrendPct,
      trendLabel: 'vs prior period',
      trendBad: true,
    },
    {
      label: 'Network Tonnes',
      value: fmtTonnes(kpis.networkTonnes),
      sub: `${kpis.routeCount} routes / ${kpis.tripCount} trips`,
      trend: kpis.tonnesTrendPct,
      trendLabel: 'vs prior period',
      trendBad: false,
    },
    {
      label: 'Hot Segments',
      value: String(kpis.hotSegments),
      sub: 'Routes above cost baseline or drifting on transit time',
      trend: null,
    },
    {
      label: 'In Transit',
      value: String(kpis.inTransit),
      sub: 'Trips currently moving on the corridor',
      trend: null,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {cards.map(card => (
        <div key={card.label} style={{
          backgroundColor: '#0d1220',
          border: '1px solid #1a2236',
          borderRadius: 8,
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 132,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#4b5563',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
          }}>
            {card.label}
          </div>
          <div style={{
            fontSize: 30, fontWeight: 800, color: '#e5e7eb',
            lineHeight: 1.05, fontVariantNumeric: 'tabular-nums', marginBottom: 8,
          }}>
            {card.value}
          </div>
          <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.45, flex: 1 }}>
            {card.sub}
          </div>
          {card.trend != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: card.trendBad ? '#f97316' : '#34d399',
              }}>
                ▲ {card.trend.toFixed(1)}%
              </span>
              <span style={{ fontSize: 11, color: '#475569' }}>{card.trendLabel}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
