'use client';

import { THEME } from '@/lib/theme';

const RISK = {
  critical: { label: 'Critical', color: THEME.critical, bg: '#1d0d07', border: '#5e271a' },
  watch:    { label: 'Watch',    color: THEME.watch,    bg: '#1c1606', border: THEME.goldDeep },
  normal:   { label: 'Normal',   color: THEME.normal,   bg: '#101a0c', border: THEME.greenDeep },
};

const money = n => `$${Math.round(n).toLocaleString()}`;
const h = n => `${(n ?? 0).toFixed(1)}h`;

function Chain({ selected }) {
  const steps = [
    { k: 'Operational event', v: selected.topDelayReason },
    { k: 'Delay drift', v: `+${(selected.delayDriftHours ?? 0).toFixed(1)}h` },
    { k: 'Financial impact', v: money(selected.avoidableCost) },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '10px 0' }}>
      {steps.map((s, i) => (
        <div key={s.k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 16, color: THEME.faint, fontSize: 12 }}>{i === 0 ? '┌' : i === steps.length - 1 ? '└' : '│'}</span>
          <span style={{ fontSize: 10, color: THEME.faint, textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 96 }}>{s.k}</span>
          <span style={{ fontSize: 11.5, color: THEME.text, fontWeight: 600 }}>{s.v}</span>
        </div>
      ))}
    </div>
  );
}

export default function IntelligenceBrief({ selected, routeAnalyses, integrity, onSelectRoute, onViewTrips }) {
  if (!selected) return null;
  const cfg = RISK[selected.risk] ?? RISK.normal;

  const strongestNormal = Object.values(routeAnalyses)
    .filter(r => r.risk === 'normal' && r.routeId !== selected.routeId)
    .sort((a, b) => b.avoidableCost - a.avoidableCost)[0];

  const flagged = Object.values(routeAnalyses)
    .filter(r => r.risk !== 'normal')
    .sort((a, b) => (a.risk === 'critical' ? -1 : 1));

  return (
    <div style={{ backgroundColor: THEME.panel, border: `1px solid ${THEME.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${THEME.border}`, backgroundColor: THEME.bg,
        fontSize: 10, fontWeight: 700, color: THEME.faint, textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        Logistics Intelligence Brief
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Flagged quick-switch */}
        {flagged.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {flagged.map(r => {
              const c = RISK[r.risk];
              const on = r.routeId === selected.routeId;
              return (
                <button key={r.routeId} onClick={() => onSelectRoute(r.routeId)} style={{
                  fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 12,
                  border: `1px solid ${on ? c.color : THEME.border}`, color: on ? c.color : THEME.muted,
                  backgroundColor: on ? c.bg : 'transparent',
                }}>{r.routeId} · {c.label}</button>
              );
            })}
          </div>
        )}

        {/* Selected segment card */}
        <section style={{ border: `1px solid ${cfg.border}`, borderRadius: 7, padding: '14px 16px', backgroundColor: cfg.bg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{cfg.label}</span>
            <span style={{ fontSize: 9.5, color: THEME.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Wk {selected.signalWeek ?? '—'} signal · Wk {selected.costBlowoutWeek ?? '—'} cost
            </span>
          </div>

          <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text, lineHeight: 1.35, marginBottom: 8 }}>
            {selected.avoidableCost > 0
              ? <>{selected.segment} generated {money(selected.avoidableCost)} of avoidable cost this period</>
              : <>{selected.segment} is holding within its cost baseline</>}
          </div>

          <p style={{ fontSize: 12, color: THEME.textDim, lineHeight: 1.55, margin: 0 }}>
            Current delay is {h(selected.currentAvgDelayHours)} versus a {h(selected.baselineAvgDelayHours)} baseline.
            Cost-per-tonne reads ${selected.actualCostPerTonne.toFixed(2)} versus ${selected.baselineCostPerTonne.toFixed(2)} baseline.
          </p>

          <Chain selected={selected} />

          <button onClick={() => onViewTrips(selected.routeId)} style={{
            fontSize: 11, fontWeight: 700, color: cfg.color, borderBottom: `1px solid ${cfg.color}`, padding: '2px 0',
          }}>
            View supporting trips →
          </button>
        </section>

        {/* Decoy / normal comparison */}
        {strongestNormal && (
          <section style={{ border: `1px solid ${RISK.normal.border}`, borderRadius: 7, padding: '12px 16px', backgroundColor: RISK.normal.bg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: THEME.normal, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Normal</span>
              <span style={{ fontSize: 9.5, color: THEME.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Decoy check</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text, lineHeight: 1.35, marginBottom: 6 }}>
              {strongestNormal.segment} stayed below the critical threshold
            </div>
            <p style={{ fontSize: 11.5, color: THEME.textDim, lineHeight: 1.5, margin: '0 0 8px' }}>
              Delay drift is +{(strongestNormal.delayDriftHours ?? 0).toFixed(1)}h with {money(strongestNormal.avoidableCost)} avoidable — it does not overtake the lead signal.
            </p>
            <button onClick={() => onSelectRoute(strongestNormal.routeId)} style={{ fontSize: 11, fontWeight: 700, color: THEME.normal, borderBottom: `1px solid ${THEME.normal}`, padding: '2px 0' }}>
              View comparison →
            </button>
          </section>
        )}

        {/* Active corridor file */}
        <section style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: THEME.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            Active corridor file
          </div>
          <p style={{ fontSize: 11.5, color: THEME.textDim, lineHeight: 1.55, margin: 0 }}>
            {integrity.rawRows} raw rows · {integrity.cleanTrips} clean trips · {integrity.routeCount} routes · {integrity.segmentCount} segments
          </p>
          <p style={{ fontSize: 11.5, color: THEME.muted, lineHeight: 1.55, margin: '4px 0 0' }}>
            {integrity.rowsNeedingReview} quarantined row{integrity.rowsNeedingReview === 1 ? '' : 's'} stay excluded. Analysis uses cleaned trips only.
          </p>
        </section>
      </div>
    </div>
  );
}
