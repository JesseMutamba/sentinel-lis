'use client';

import { THEME } from '@/lib/theme';

const HEADERS = ['Trip ID', 'Week', 'Extra Delay (hrs)', 'CPT ($/t)', 'Tonnes', 'Status'];

export default function TripEvidence({ trips, routeAnalysis }) {
  return (
    <div>
      {routeAnalysis && (
        <div style={{ fontSize: 12, color: THEME.muted, marginBottom: 12 }}>
          {routeAnalysis.segment} · {trips.length} trip{trips.length === 1 ? '' : 's'}
        </div>
      )}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 430 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ backgroundColor: THEME.panelDark, borderBottom: `2px solid ${THEME.border}` }}>
              {HEADERS.map(h => (
                <th key={h} style={{
                  padding: '8px 12px', textAlign: 'left', color: THEME.muted, fontWeight: 700,
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trips.map((trip, i) => {
              const isQ = trip.status === 'quarantined';
              return (
                <tr key={trip.id} style={{ borderBottom: `1px solid ${THEME.border}`, backgroundColor: isQ ? '#1d0d07' : i % 2 ? THEME.panelDark : 'transparent' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, color: isQ ? THEME.critical : THEME.text, whiteSpace: 'nowrap' }}>{trip.id}</td>
                  <td style={{ padding: '8px 12px', color: THEME.textDim }}>W{trip.week}</td>
                  <td style={{ padding: '8px 12px', color: trip.delay == null ? THEME.faint : THEME.text }}>
                    {trip.delay == null ? '—' : trip.delay > 0 ? `+${trip.delay.toFixed(1)}` : trip.delay.toFixed(1)}
                  </td>
                  <td style={{ padding: '8px 12px', color: trip.cpt == null ? THEME.faint : THEME.text }}>
                    {trip.cpt == null ? '—' : `$${trip.cpt.toFixed(2)}`}
                  </td>
                  <td style={{ padding: '8px 12px', color: THEME.textDim }}>
                    {trip.tonnes == null ? '—' : trip.tonnes.toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                      backgroundColor: isQ ? '#3a1408' : '#16240f',
                      color: isQ ? THEME.critical : THEME.normal,
                      textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                    }}>{trip.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
