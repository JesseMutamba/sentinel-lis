'use client';

import { useState } from 'react';
import { THEME } from '@/lib/theme';

function Trend({ value, bad }) {
  if (value == null) return null;
  const up = value >= 0;
  const good = bad ? !up : up;
  const color = good ? THEME.greenBright : THEME.critical;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%</span>
      <span style={{ fontSize: 11, color: THEME.faint }}>vs prior period</span>
    </div>
  );
}

export default function KPICards({ metrics, explanations = {} }) {
  const m = metrics;
  const [open, setOpen] = useState(null);

  const cards = [
    { key: 'avoidableCost', label: 'Avoidable Cost', value: `$${Math.round(m.avoidableCost).toLocaleString()}`, sub: `Cost leak vs baseline · ${m.periodLabel}`, trend: m.avoidableTrend, trendBad: true },
    { key: 'networkTonnes', label: 'Network Tonnes', value: `${Math.round(m.networkTonnes).toLocaleString()} t`, sub: `${m.routeCount} active routes`, trend: m.tonnesTrend, trendBad: false },
    { key: 'hotSegments', label: 'Hot Segments', value: String(m.hotSegments), sub: 'Above cost baseline or drifting on transit', trend: null },
    { key: 'inTransit', label: 'In Transit', value: String(m.inTransit), sub: 'Trips moving in this period', trend: null },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, alignItems: 'start' }}>
      {cards.map(card => {
        const bullets = explanations[card.key] ?? [];
        const isOpen = open === card.key;
        return (
          <div key={card.key} style={{
            backgroundColor: THEME.panel, border: `1px solid ${isOpen ? THEME.greenDeep : THEME.border}`,
            borderRadius: 8, padding: '16px 18px', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: THEME.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: THEME.text, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 11, color: THEME.muted, lineHeight: 1.4 }}>{card.sub}</div>
            <Trend value={card.trend} bad={card.trendBad} />

            {bullets.length > 0 && (
              <>
                <button
                  onClick={() => setOpen(isOpen ? null : card.key)}
                  style={{
                    marginTop: 12, alignSelf: 'flex-start', fontSize: 11, fontWeight: 700,
                    color: THEME.greenBright, letterSpacing: '0.04em',
                  }}
                >
                  {isOpen ? '▾ Why this number' : '▸ Why this number'}
                </button>
                {isOpen && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 7, borderTop: `1px solid ${THEME.border}`, paddingTop: 10 }}>
                    {bullets.map((b, i) => (
                      <div key={i} style={{ fontSize: 11, color: THEME.textDim, lineHeight: 1.5, display: 'flex', gap: 6 }}>
                        <span style={{ color: THEME.green }}>•</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
