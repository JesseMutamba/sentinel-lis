'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/theme';

export default function AnalystLayer({ integrity, thresholds, source }) {
  const THEME = useTheme();
  const [open, setOpen] = useState(true);

  const sourceRoles = [
    {
      role: 'Operational backbone',
      name: source?.kind === 'url' ? 'Connected CSV feed' : source?.kind === 'upload' ? 'Uploaded trips' : 'Cleaned sample trips',
      detail: `${integrity.cleanTrips} trips carry route, week, tonne, delay and cost facts.`,
    },
    {
      role: 'Control layer',
      name: 'Cleaning report',
      detail: `${integrity.duplicatesDropped} duplicate row${integrity.duplicatesDropped === 1 ? '' : 's'} removed; ${integrity.rowsNeedingReview} row${integrity.rowsNeedingReview === 1 ? '' : 's'} held out of analysis.`,
    },
    {
      role: 'Signal layer',
      name: 'Corridor analysis',
      detail: `${thresholds.rollingWindowWeeks}-week delay windows and cost-per-tonne thresholds convert operations into exposure.`,
    },
  ];

  const checks = [
    `${integrity.cleanTrips} cleaned rows analyzed`,
    `Weeks ${thresholds.baselineWeeks.join('–')} baseline`,
    `${thresholds.rollingWindowWeeks}-week rolling delay window`,
    `${Math.round((thresholds.costBlowoutThresholdMultiplier - 1) * 100)}% cost blowout threshold`,
    `${thresholds.delayWarningThresholdHours}h delay warning`,
  ];

  return (
    <section style={{ backgroundColor: THEME.panel, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: THEME.greenBright, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
            Connected analyst layer
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text }}>
            Every number carries its source role, driver, and validation check.
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ fontSize: 11, fontWeight: 700, color: THEME.textDim, whiteSpace: 'nowrap' }}>
          {open ? '▾ Hide' : '▸ Show'}
        </button>
      </div>

      {open && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
            {sourceRoles.map(s => (
              <div key={s.role} style={{
                backgroundColor: THEME.panelDark, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: '12px 14px',
                transition: 'border-color 0.12s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = THEME.greenDeep)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = THEME.border)}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: THEME.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.role}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text, margin: '3px 0 5px' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: THEME.muted, lineHeight: 1.5 }}>{s.detail}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {checks.map(c => (
              <span key={c} style={{
                fontSize: 11, color: THEME.textDim, backgroundColor: THEME.panelDark,
                border: `1px solid ${THEME.border}`, borderRadius: 20, padding: '4px 12px',
              }}>
                ✓ {c}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
