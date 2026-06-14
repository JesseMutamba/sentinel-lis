export default function KPICards({ kpis, hotSegments, totalTonnes }) {
  const cards = [
    {
      label: 'Avoidable Cost',
      value: `$${Math.round(kpis.avoidableCost).toLocaleString()}`,
      sub: 'Across routes with cost blowout vs. baseline cost basis — latest 3-week data',
      trend: '+11.1%',
      trendUp: true,
      trendLabel: 'vs prior period',
    },
    {
      label: 'Network Tonnes',
      value: `${Math.round(totalTonnes / 1000).toLocaleString()},${String(Math.round(totalTonnes % 1000)).padStart(3, '0')} t`,
      sub: `${kpis.tripsClean.toLocaleString()} routes / ${kpis.tripsIngested} trips`,
      trend: '+3.8%',
      trendUp: true,
      trendLabel: 'vs prior period',
    },
    {
      label: 'Hot Segments',
      value: String(hotSegments),
      sub: 'Route state cost baseline or drifting on time',
      trend: null,
      trendLabel: null,
    },
    {
      label: 'In Transit',
      value: String(kpis.tripsIngested - kpis.tripsClean - kpis.tripsQuarantined + 1),
      sub: 'Trips currently tracked on the corridor',
      trend: null,
      trendLabel: null,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {cards.map(card => (
        <div
          key={card.label}
          style={{
            backgroundColor: '#0d1220',
            border: '1px solid #1a2236',
            borderRadius: 8,
            padding: '16px 18px',
          }}
        >
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#4b5563',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
          }}>
            {card.label}
          </div>
          <div style={{
            fontSize: 28, fontWeight: 800, color: '#e5e7eb',
            lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', marginBottom: 6,
          }}>
            {card.value}
          </div>
          <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.4, marginBottom: card.trend ? 8 : 0 }}>
            {card.sub}
          </div>
          {card.trend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: card.trendUp ? '#f97316' : '#4ade80',
              }}>
                {card.trendUp ? '▲' : '▼'} {card.trend}
              </span>
              <span style={{ fontSize: 11, color: '#4b5563' }}>{card.trendLabel}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
