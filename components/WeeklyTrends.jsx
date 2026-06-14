'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';

const PANEL = { backgroundColor: '#080d18', border: '1px solid #1a2236', borderRadius: 6, padding: '14px 8px 8px' };
const TICK = { fill: '#5b6677', fontSize: 11 };
const TT = {
  contentStyle: { backgroundColor: '#0d1220', border: '1px solid #2a3550', borderRadius: 4, fontSize: 12 },
  labelStyle: { color: '#94a3b8' }, itemStyle: { color: '#e5e7eb' },
};

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </div>
  );
}

export default function WeeklyTrends({ route }) {
  if (!route) return null;
  const { weekly, plannedTransit, baselineCPT, costData, from, to } = route;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ fontSize: 12, color: '#64748b' }}>
        {from} → {to} · 12-week survey
      </div>

      {/* Transit */}
      <div>
        <SectionLabel>Weekly Avg Transit (hours)</SectionLabel>
        <div style={PANEL}>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2236" />
              <XAxis dataKey="label" tick={TICK} />
              <YAxis tick={TICK} unit="h" domain={['auto', 'auto']} />
              <Tooltip {...TT} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <ReferenceLine y={plannedTransit} stroke="#34d399" strokeDasharray="5 4"
                label={{ value: `Plan ${plannedTransit}h`, fill: '#34d399', fontSize: 10, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="transit" name="Avg Transit"
                stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost */}
      <div>
        <SectionLabel>Weekly Avg Cost Per Tonne ($)</SectionLabel>
        {costData ? (
          <div style={PANEL}>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2236" />
                <XAxis dataKey="label" tick={TICK} />
                <YAxis tick={TICK} unit="$" domain={['auto', 'auto']} />
                <Tooltip {...TT} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <ReferenceLine y={baselineCPT} stroke="#34d399" strokeDasharray="5 4"
                  label={{ value: `Baseline $${baselineCPT}`, fill: '#34d399', fontSize: 10, position: 'insideTopRight' }} />
                <ReferenceLine y={+(baselineCPT * 1.12).toFixed(1)} stroke="#f97316" strokeDasharray="5 4"
                  label={{ value: 'Blowout', fill: '#f97316', fontSize: 10, position: 'insideBottomRight' }} />
                <Line type="monotone" dataKey="cpt" name="Avg CPT"
                  stroke="#fbbf24" strokeWidth={2} dot={{ fill: '#fbbf24', r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ ...PANEL, padding: '40px 16px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
            No cost data available for this route yet — transit drift is the early signal.
          </div>
        )}
      </div>
    </div>
  );
}
