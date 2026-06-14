'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const CHART_BG = { backgroundColor: '#0d1526', border: '1px solid #1f2937', borderRadius: 6, padding: '14px 8px 8px' };
const AXIS_TICK = { fill: '#6b7280', fontSize: 11 };
const TOOLTIP_STYLE = { contentStyle: { backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 4, fontSize: 12 }, labelStyle: { color: '#9ca3af' }, itemStyle: { color: '#f9fafb' } };

export default function WeeklyTrends({ routeAnalysis }) {
  if (!routeAnalysis) return null;

  const { weeklyData, baselineCPT, signalWeek, blowoutWeek, routeId } = routeAnalysis;
  const signalLabel = `W${signalWeek}`;
  const blowoutLabel = `W${blowoutWeek}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Delay Chart */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Weekly Avg Delay — Extra Hours Above Baseline
        </div>
        <div style={CHART_BG}>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} unit="h" />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <ReferenceLine
                y={6}
                stroke="#f59e0b"
                strokeDasharray="5 4"
                label={{ value: 'Signal (6h)', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
              />
              {signalWeek && (
                <ReferenceLine
                  x={signalLabel}
                  stroke="#ef4444"
                  strokeDasharray="5 4"
                  label={{ value: 'Signal', fill: '#ef4444', fontSize: 10, position: 'top' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="avgDelay"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ fill: '#60a5fa', r: 3 }}
                name="Avg Delay"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="rollingDelay"
                stroke="#a78bfa"
                strokeWidth={2.5}
                strokeDasharray="6 3"
                dot={false}
                name="3-Wk Rolling"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CPT Chart */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Weekly Avg Cost Per Tonne ($)
        </div>
        <div style={CHART_BG}>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} unit="$" domain={['auto', 'auto']} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <ReferenceLine
                y={+(baselineCPT * 1.12).toFixed(2)}
                stroke="#ef4444"
                strokeDasharray="5 4"
                label={{ value: 'Blowout', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
              />
              {blowoutWeek && (
                <ReferenceLine
                  x={blowoutLabel}
                  stroke="#ef4444"
                  strokeDasharray="5 4"
                  label={{ value: 'Blowout', fill: '#ef4444', fontSize: 10, position: 'top' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="avgCPT"
                stroke="#fbbf24"
                strokeWidth={2}
                dot={{ fill: '#fbbf24', r: 3 }}
                name="Avg CPT"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="rollingCPT"
                stroke="#f472b6"
                strokeWidth={2.5}
                strokeDasharray="6 3"
                dot={false}
                name="3-Wk Rolling"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
