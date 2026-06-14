'use client';

import { useState } from 'react';
import { THEME } from '@/lib/theme';

function Trend({ value, bad }) {
  if (value == null) return null;
  const up = value >= 0;
  const good = bad ? !up : up;
  const color = good ? THEME.greenBright : THEME.critical;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color }}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}% <span style={{ color: THEME.faint, fontWeight: 400 }}>vs prior</span>
    </span>
  );
}

export default function KPICards({ metrics, explanations = {}, hero }) {
  const m = metrics;
  const [open, setOpen] = useState(null);

  const cards = [
    { key: 'avoidableCost', label: 'Avoidable Cost', value: `$${Math.round(m.avoidableCost).toLocaleString()}`, sub: `Blown-out segments · ${m.periodLabel}`, trend: m.avoidableTrend, trendBad: true, accent: true },
    { key: 'networkTonnes', label: 'Network Tonnes', value: `${Math.round(m.networkTonnes).toLocaleString()} t`, sub: `${m.routeCount} active routes`, trend: m.tonnesTrend, trendBad: false },
    { key: 'hotSegments', label: 'Hot Segments', value: String(m.hotSegments), sub: 'Above cost baseline or drifting', trend: null },
    { key: 'leadTime', label: 'Lead Time', value: hero?.leadTimeWeeks != null ? `${hero.leadTimeWeeks} wks` : '—', sub: 'Delay signal before cost blowout', trend: null },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, alignItems: 'start' }}>
      {cards.map(card => {
        const bullets = explanations[card.key] ?? [];
        const driver = bullets[0];
        const rest = bullets.slice(1);
        const isOpen = open === card.key;
        return (
          <div key={card.key} style={{
            backgroundColor: THEME.panel,
            border: `1px solid ${card.accent ? THEME.goldDeep : (isOpen ? THEME.greenDeep : THEME.border)}`,
            borderRadius: 8, padding: '16px 18px', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: THEME.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: card.accent ? THEME.goldBright : THEME.text, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>
              {card.value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: THEME.muted }}>{card.sub}</span>
              <Trend value={card.trend} bad={card.trendBad} />
            </div>

            {driver && (
              <div style={{ fontSize: 11, color: THEME.textDim, lineHeight: 1.5, borderTop: `1px solid ${THEME.border}`, paddingTop: 8 }}>
                {driver}
              </div>
            )}

            {rest.length > 0 && (
              <>
                <button onClick={() => setOpen(isOpen ? null : card.key)}
                  style={{ marginTop: 8, alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, color: THEME.greenBright }}>
                  {isOpen ? '▾ Less' : '▸ Why this number'}
                </button>
                {isOpen && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {rest.map((b, i) => (
                      <div key={i} style={{ fontSize: 11, color: THEME.textDim, lineHeight: 1.5, display: 'flex', gap: 6 }}>
                        <span style={{ color: THEME.green }}>•</span><span>{b}</span>
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
