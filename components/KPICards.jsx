import { THEME } from '@/lib/theme';

function Trend({ value, bad }) {
  if (value == null) return null;
  const up = value >= 0;
  const good = bad ? !up : up;        // rising cost is bad; rising tonnage is good
  const color = good ? THEME.greenBright : THEME.critical;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>
        {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
      </span>
      <span style={{ fontSize: 11, color: THEME.faint }}>vs prior period</span>
    </div>
  );
}

export default function KPICards({ metrics }) {
  const m = metrics;
  const cards = [
    {
      label: 'Avoidable Cost',
      value: `$${Math.round(m.avoidableCost).toLocaleString()}`,
      sub: `Cost leak vs baseline · ${m.periodLabel}`,
      trend: m.avoidableTrend,
      trendBad: true,
    },
    {
      label: 'Network Tonnes',
      value: `${Math.round(m.networkTonnes).toLocaleString()} t`,
      sub: `${m.routeCount} active routes`,
      trend: m.tonnesTrend,
      trendBad: false,
    },
    {
      label: 'Hot Segments',
      value: String(m.hotSegments),
      sub: 'Above cost baseline or drifting on transit',
      trend: null,
    },
    {
      label: 'In Transit',
      value: String(m.inTransit),
      sub: 'Trips moving in this period',
      trend: null,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {cards.map(card => (
        <div key={card.label} style={{
          backgroundColor: THEME.panel,
          border: `1px solid ${THEME.border}`,
          borderRadius: 8,
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 124,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: THEME.faint,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
          }}>
            {card.label}
          </div>
          <div style={{
            fontSize: 28, fontWeight: 800, color: THEME.text,
            lineHeight: 1.05, fontVariantNumeric: 'tabular-nums', marginBottom: 6,
          }}>
            {card.value}
          </div>
          <div style={{ fontSize: 11, color: THEME.muted, lineHeight: 1.4, flex: 1 }}>
            {card.sub}
          </div>
          <Trend value={card.trend} bad={card.trendBad} />
        </div>
      ))}
    </div>
  );
}
