'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import { THEME } from '@/lib/theme';

const PANEL = { backgroundColor: THEME.panelDark, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: '14px 8px 8px' };
const TICK = { fill: THEME.muted, fontSize: 11 };
const TT = {
  contentStyle: { backgroundColor: THEME.panel, border: `1px solid ${THEME.border}`, borderRadius: 4, fontSize: 12 },
  labelStyle: { color: THEME.textDim }, itemStyle: { color: THEME.text },
};
const LABEL = { fontSize: 12, fontWeight: 600, color: THEME.textDim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' };

export default function WeeklyTrends({ routeAnalysis }) {
  if (!routeAnalysis) return null;
  const { weeklyData, baselineCPT, signalWeek, blowoutWeek, segment } = routeAnalysis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ fontSize: 12, color: THEME.muted }}>{segment} · {weeklyData.length}-week survey</div>

      {/* Delay */}
      <div>
        <div style={LABEL}>Weekly Avg Delay — Extra Hours Above Baseline</div>
        <div style={PANEL}>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
              <XAxis dataKey="label" tick={TICK} />
              <YAxis tick={TICK} unit="h" />
              <Tooltip {...TT} />
              <Legend wrapperStyle={{ fontSize: 11, color: THEME.textDim }} />
              <ReferenceLine y={6} stroke={THEME.watch} strokeDasharray="5 4"
                label={{ value: 'Signal (6h)', fill: THEME.watch, fontSize: 10, position: 'insideTopRight' }} />
              {signalWeek && (
                <ReferenceLine x={`W${signalWeek}`} stroke={THEME.critical} strokeDasharray="5 4"
                  label={{ value: 'Signal', fill: THEME.critical, fontSize: 10, position: 'top' }} />
              )}
              <Line type="monotone" dataKey="avgDelay" name="Avg Delay" stroke={THEME.greenBright} strokeWidth={2} dot={{ fill: THEME.greenBright, r: 3 }} connectNulls />
              <Line type="monotone" dataKey="rollingDelay" name="3-Wk Rolling" stroke={THEME.gold} strokeWidth={2.5} strokeDasharray="6 3" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CPT */}
      <div>
        <div style={LABEL}>Weekly Avg Cost Per Tonne ($)</div>
        <div style={PANEL}>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
              <XAxis dataKey="label" tick={TICK} />
              <YAxis tick={TICK} unit="$" domain={['auto', 'auto']} />
              <Tooltip {...TT} />
              <Legend wrapperStyle={{ fontSize: 11, color: THEME.textDim }} />
              <ReferenceLine y={+(baselineCPT * 1.12).toFixed(2)} stroke={THEME.critical} strokeDasharray="5 4"
                label={{ value: 'Blowout', fill: THEME.critical, fontSize: 10, position: 'insideTopRight' }} />
              {blowoutWeek && (
                <ReferenceLine x={`W${blowoutWeek}`} stroke={THEME.critical} strokeDasharray="5 4"
                  label={{ value: 'Blowout', fill: THEME.critical, fontSize: 10, position: 'top' }} />
              )}
              <Line type="monotone" dataKey="avgCPT" name="Avg CPT" stroke={THEME.gold} strokeWidth={2} dot={{ fill: THEME.gold, r: 3 }} connectNulls />
              <Line type="monotone" dataKey="rollingCPT" name="3-Wk Rolling" stroke={THEME.greenBright} strokeWidth={2.5} strokeDasharray="6 3" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
