const RISK_CFG = {
  critical: { label: 'CRITICAL', color: '#f87171', bg: '#450a0a', border: '#7f1d1d', dot: '🔴' },
  watch:    { label: 'WATCH',    color: '#fbbf24', bg: '#451a03', border: '#78350f', dot: '🟡' },
  normal:   { label: 'NORMAL',   color: '#4ade80', bg: '#052e16', border: '#14532d', dot: '🟢' },
};

function MetricCard({ label, value, sub, valueColor }) {
  return (
    <div
      style={{
        backgroundColor: '#0d1526',
        border: '1px solid #1f2937',
        borderRadius: 6,
        padding: '10px 12px',
      }}
    >
      <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: valueColor || '#f9fafb', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function buildNarrative(ra, routeId) {
  const { risk, signalWeek, blowoutWeek, drift, avoidableCost, origin, dest, baselineCPT, latestAvgCPT } = ra;

  if (risk === 'critical') {
    return (
      `Route ${routeId} (${origin} → ${dest}) has entered a CRITICAL state. ` +
      `Rolling delay signals first breached the +6 hr threshold in Week ${signalWeek}. ` +
      `Cost blowout was confirmed in Week ${blowoutWeek} when the 3-week rolling CPT exceeded ` +
      `the $${(baselineCPT * 1.12).toFixed(2)}/t trigger. ` +
      `Latest CPT is $${latestAvgCPT.toFixed(2)}/t against a $${baselineCPT}/t baseline. ` +
      `Cumulative avoidable cost over the latest 3-week window stands at ` +
      `$${Math.round(avoidableCost).toLocaleString()}. Immediate intervention is recommended.`
    );
  }
  if (risk === 'watch') {
    if (signalWeek) {
      return (
        `Route ${routeId} (${origin} → ${dest}) is under elevated monitoring. ` +
        `Delay signals were first detected in Week ${signalWeek}. ` +
        `No cost blowout has been confirmed yet — rolling CPT remains below the $${(baselineCPT * 1.12).toFixed(2)}/t trigger. ` +
        `Monitor closely for further deterioration toward critical status.`
      );
    }
    return (
      `Route ${routeId} (${origin} → ${dest}) is under elevated monitoring. ` +
      `Current rolling delay drift of ${drift.toFixed(1)} hrs is above the 4 hr watch threshold. ` +
      `No formal signal or cost blowout detected yet. Early-stage deterioration warrants close observation.`
    );
  }
  return (
    `Route ${routeId} (${origin} → ${dest}) is operating within normal parameters. ` +
    `No significant delay signals or cost anomalies detected over the 12-week survey. ` +
    `Rolling averages remain stable within baseline thresholds.`
  );
}

export default function IntelligenceBrief({ routeAnalysis, selectedRoute }) {
  if (!routeAnalysis) return null;

  const cfg = RISK_CFG[routeAnalysis.risk];
  const ra = routeAnalysis;

  const metrics = [
    {
      label: 'Signal Week',
      value: ra.signalWeek ? `W${ra.signalWeek}` : 'None',
      valueColor: ra.signalWeek ? '#fbbf24' : '#4b5563',
      sub: 'Rolling avg delay > +6 hrs',
    },
    {
      label: 'Blowout Week',
      value: ra.blowoutWeek ? `W${ra.blowoutWeek}` : 'None',
      valueColor: ra.blowoutWeek ? '#f87171' : '#4b5563',
      sub: 'Rolling avg CPT > baseline×1.12',
    },
    {
      label: 'Avoidable Cost',
      value: `$${Math.round(ra.avoidableCost).toLocaleString()}`,
      valueColor: ra.avoidableCost > 0 ? '#f87171' : '#4ade80',
      sub: 'Latest 3-week window',
    },
    {
      label: 'Latest Delay',
      value: ra.latestRollingDelay !== null ? `+${ra.latestRollingDelay.toFixed(1)} hrs` : '—',
      valueColor: (ra.latestRollingDelay ?? 0) > 6 ? '#f87171' : (ra.latestRollingDelay ?? 0) > 4 ? '#fbbf24' : '#60a5fa',
      sub: '3-wk rolling, extra above baseline',
    },
    {
      label: 'Latest CPT',
      value: `$${ra.latestAvgCPT.toFixed(2)}/t`,
      valueColor: '#f9fafb',
      sub: `Baseline $${ra.baselineCPT}/t`,
    },
    {
      label: 'Delay Drift',
      value: `${ra.drift.toFixed(1)} hrs`,
      valueColor: ra.drift > 6 ? '#f87171' : ra.drift > 4 ? '#fbbf24' : '#4ade80',
      sub: 'vs baseline transit',
    },
  ];

  return (
    <div
      style={{
        backgroundColor: '#111827',
        border: '1px solid #1f2937',
        borderRadius: 8,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Header */}
      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Intelligence Brief
      </div>

      {/* Risk badge + route */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div
          style={{
            backgroundColor: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderRadius: 6,
            padding: '6px 14px',
            color: cfg.color,
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: '0.12em',
          }}
        >
          {cfg.label}
        </div>
        <div style={{ color: '#9ca3af', fontSize: 13 }}>
          {ra.origin} → {ra.dest}
        </div>
      </div>

      {/* 6 metric cards in 2×3 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {metrics.map(m => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Narrative */}
      <div
        style={{
          fontSize: 12,
          color: '#9ca3af',
          lineHeight: 1.65,
          backgroundColor: '#0d1526',
          borderRadius: 6,
          padding: '12px 14px',
          border: '1px solid #1f2937',
        }}
      >
        {buildNarrative(ra, selectedRoute)}
      </div>
    </div>
  );
}
