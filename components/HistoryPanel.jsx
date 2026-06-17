'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/lib/theme';

const money = n => `$${Math.round(n).toLocaleString()}`;
const tFmt = n => `${Math.round(n).toLocaleString()} t`;
const timeLabel = ts => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const clockLabel = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function Delta({ from, to, fmt, bad }) {
  const THEME = useTheme();
  const d = to - from;
  if (Math.abs(d) < 1e-9) return <span style={{ fontSize: 11, color: THEME.faint }}>no change</span>;
  const up = d > 0;
  const good = bad ? !up : up;
  const color = good ? THEME.greenBright : THEME.critical;
  const pct = from ? ` (${up ? '+' : ''}${((d / from) * 100).toFixed(1)}%)` : '';
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color }}>
      {up ? '▲' : '▼'} {fmt(Math.abs(d))}{pct}
    </span>
  );
}

function CompareCard({ label, from, to, fmt, bad }) {
  const THEME = useTheme();
  return (
    <div style={{ backgroundColor: THEME.panelDark, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: THEME.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: THEME.muted, textDecoration: 'line-through', textDecorationColor: THEME.faint }}>{fmt(from)}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: THEME.text }}>→ {fmt(to)}</span>
      </div>
      <div style={{ marginTop: 5 }}><Delta from={from} to={to} fmt={fmt} bad={bad} /></div>
    </div>
  );
}

function CaptureButton({ onCapture }) {
  const THEME = useTheme();
  return (
    <button onClick={onCapture} style={{
      fontSize: 11, fontWeight: 700, color: THEME.onAccent, backgroundColor: THEME.accent,
      borderRadius: 5, padding: '6px 12px',
    }}>
      ＋ Capture snapshot now
    </button>
  );
}

export default function HistoryPanel({ history, onClear, onCapture }) {
  const THEME = useTheme();
  const [baselineIdx, setBaselineIdx] = useState(0);

  if (!history || history.length === 0) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: THEME.muted }}>No snapshots yet.</div>
        {onCapture && <CaptureButton onCapture={onCapture} />}
      </div>
    );
  }

  const latest = history[history.length - 1];
  const baseIdx = Math.min(baselineIdx, history.length - 1);
  const baseline = history[baseIdx];

  if (history.length < 2) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 12, color: THEME.muted, lineHeight: 1.6 }}>
          History records snapshots as your data changes — one captured so far ({clockLabel(latest.ts)}).
          To see a before → after now: click <strong style={{ color: THEME.textDim }}>Capture snapshot</strong> to mark a baseline,
          edit the connected sheet, hit <strong style={{ color: THEME.textDim }}>↻ Refresh now</strong> on the source bar, and a second snapshot will appear here.
        </div>
        <div><CaptureButton onCapture={onCapture} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <CompareCard label="Avoidable cost" from={latest.avoidableCost} to={latest.avoidableCost} fmt={money} bad />
          <CompareCard label="Network tonnes" from={latest.networkTonnes} to={latest.networkTonnes} fmt={tFmt} />
        </div>
      </div>
    );
  }

  const chartData = history.map(s => ({
    label: clockLabel(s.ts),
    avoidable: Math.round(s.avoidableCost),
    tonnes: Math.round(s.networkTonnes),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: THEME.muted }}>
          Comparing <strong style={{ color: THEME.textDim }}>{timeLabel(baseline.ts)}</strong> → <strong style={{ color: THEME.text }}>{timeLabel(latest.ts)} (latest)</strong> · {history.length} snapshots
        </span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <CaptureButton onCapture={onCapture} />
          <button onClick={onClear} style={{ fontSize: 11, fontWeight: 700, color: THEME.muted }}>Clear history</button>
        </div>
      </div>

      {/* Before → after KPI comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <CompareCard label="Avoidable cost" from={baseline.avoidableCost} to={latest.avoidableCost} fmt={money} bad />
        <CompareCard label="Network tonnes" from={baseline.networkTonnes} to={latest.networkTonnes} fmt={tFmt} />
        <CompareCard label="Flagged segments" from={baseline.flaggedSegments} to={latest.flaggedSegments} fmt={n => String(Math.round(n))} bad />
        <CompareCard label="Clean trips" from={baseline.cleanTrips} to={latest.cleanTrips} fmt={n => String(Math.round(n))} />
      </div>

      {/* Trend chart */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textDim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Avoidable cost over time
        </div>
        <div style={{ backgroundColor: THEME.panelDark, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: '14px 8px 8px' }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
              <XAxis dataKey="label" tick={{ fill: THEME.muted, fontSize: 10 }} />
              <YAxis tick={{ fill: THEME.muted, fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: THEME.panel, border: `1px solid ${THEME.border}`, borderRadius: 4, fontSize: 12 }}
                labelStyle={{ color: THEME.textDim }} itemStyle={{ color: THEME.text }}
                formatter={v => money(v)}
              />
              <Line type="monotone" dataKey="avoidable" name="Avoidable" stroke={THEME.gold} strokeWidth={2} dot={{ fill: THEME.gold, r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Snapshot list (pick a baseline to compare against) */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textDim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Snapshots · click one to compare against latest
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
          {history.slice().reverse().map((s, ri) => {
            const idx = history.length - 1 - ri;
            const isBase = idx === baseIdx;
            const isLatest = idx === history.length - 1;
            return (
              <button key={s.ts} onClick={() => setBaselineIdx(idx)} style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 1fr 70px', gap: 10, alignItems: 'center',
                padding: '8px 12px', borderRadius: 5, textAlign: 'left',
                border: `1px solid ${isBase ? THEME.selected : THEME.border}`,
                backgroundColor: isBase ? THEME.accentSoft : 'transparent',
              }}>
                <span style={{ fontSize: 11, color: THEME.textDim }}>
                  {clockLabel(s.ts)}{isLatest ? <span style={{ color: THEME.greenBright, fontWeight: 700 }}> · latest</span> : ''}
                </span>
                <span style={{ fontSize: 11, color: THEME.muted }}>{money(s.avoidableCost)}</span>
                <span style={{ fontSize: 11, color: THEME.muted }}>{tFmt(s.networkTonnes)}</span>
                <span style={{ fontSize: 11, color: THEME.muted }}>{s.cleanTrips} clean</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
