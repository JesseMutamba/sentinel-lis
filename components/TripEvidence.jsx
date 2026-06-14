const HEADERS = ['Trip ID', 'Leg', 'Wk', 'Tonnes', 'CPT ($/t)', 'Transit (h)', 'Status'];

const STATUS_STYLE = {
  clean:           { bg: '#06140e', color: '#34d399' },
  'no-cost-data':  { bg: '#12100a', color: '#ca8a04' },
  quarantined:     { bg: '#1a0a02', color: '#f97316' },
};

export default function TripEvidence({ trips, route }) {
  return (
    <div>
      {route && (
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
          {route.from} → {route.to} · {trips.length} trip{trips.length === 1 ? '' : 's'}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #1a2236' }}>
              {HEADERS.map(h => (
                <th key={h} style={{
                  padding: '8px 12px', textAlign: 'left', color: '#475569',
                  fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trips.map((trip, i) => {
              const ss = STATUS_STYLE[trip.status] ?? STATUS_STYLE.clean;
              const isBad = trip.status === 'quarantined';
              return (
                <tr key={trip.id} style={{ borderBottom: '1px solid #161e2e', backgroundColor: isBad ? '#160803' : i % 2 ? '#0b1019' : 'transparent' }}>
                  <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 12, color: isBad ? '#f97316' : '#cbd5e1', whiteSpace: 'nowrap' }}>
                    {trip.id}
                  </td>
                  <td style={{ padding: '9px 12px', color: '#94a3b8', whiteSpace: 'nowrap', fontSize: 12 }}>{trip.leg}</td>
                  <td style={{ padding: '9px 12px', color: '#64748b' }}>W{trip.week}</td>
                  <td style={{ padding: '9px 12px', color: trip.tonnes == null ? '#475569' : '#cbd5e1' }}>
                    {trip.tonnes == null ? '—' : trip.tonnes.toLocaleString()}
                  </td>
                  <td style={{ padding: '9px 12px', color: trip.cpt == null ? '#475569' : '#cbd5e1' }}>
                    {trip.cpt == null ? '—' : `$${trip.cpt.toFixed(2)}`}
                  </td>
                  <td style={{ padding: '9px 12px', color: trip.transit == null ? '#475569' : '#cbd5e1' }}>
                    {trip.transit == null ? '—' : trip.transit.toFixed(1)}
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                      backgroundColor: ss.bg, color: ss.color, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                    }}>
                      {trip.status}
                    </span>
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
