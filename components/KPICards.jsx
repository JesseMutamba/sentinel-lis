export default function KPICards({ kpis }) {
  const cards = [
    {
      label: 'Trips Ingested',
      value: kpis.tripsIngested.toLocaleString(),
      color: '#60a5fa',
      sub: '12-week corridor survey',
    },
    {
      label: 'Clean Trips',
      value: kpis.tripsClean.toLocaleString(),
      color: '#4ade80',
      sub: 'Passed validation',
    },
    {
      label: 'Quarantined',
      value: kpis.tripsQuarantined.toLocaleString(),
      color: '#fbbf24',
      sub: 'Null delay/cost records',
    },
    {
      label: 'Avoidable Cost',
      value: `$${Math.round(kpis.avoidableCost).toLocaleString()}`,
      color: '#f87171',
      sub: 'Latest 3-wk window, all routes',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
      }}
    >
      {cards.map(card => (
        <div
          key={card.label}
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: 8,
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              color: '#6b7280',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {card.label}
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: card.color,
              marginTop: 4,
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {card.value}
          </div>
          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
