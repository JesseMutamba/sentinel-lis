const HEADERS = ['Trip ID', 'Week', 'Extra Delay (hrs)', 'CPT ($/t)', 'Tonnes', 'Status'];

export default function TripEvidence({ trips }) {
  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 460 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <tr style={{ backgroundColor: '#0d1526', borderBottom: '2px solid #1f2937' }}>
            {HEADERS.map(h => (
              <th
                key={h}
                style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  color: '#6b7280',
                  fontWeight: 600,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trips.map((trip, i) => {
            const isQ = trip.status === 'quarantined';
            return (
              <tr
                key={trip.id}
                style={{
                  borderBottom: '1px solid #1f2937',
                  backgroundColor: isQ ? '#1c1107' : i % 2 === 0 ? 'transparent' : '#0d1526',
                }}
              >
                <td
                  style={{
                    padding: '8px 12px',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: isQ ? '#fbbf24' : '#e5e7eb',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {trip.id}
                </td>
                <td style={{ padding: '8px 12px', color: '#9ca3af' }}>W{trip.week}</td>
                <td style={{ padding: '8px 12px', color: trip.delay === null ? '#4b5563' : '#e5e7eb' }}>
                  {trip.delay === null ? '—' : trip.delay > 0 ? `+${trip.delay.toFixed(1)}` : trip.delay.toFixed(1)}
                </td>
                <td style={{ padding: '8px 12px', color: trip.cpt === null ? '#4b5563' : '#e5e7eb' }}>
                  {trip.cpt === null ? '—' : `$${trip.cpt.toFixed(2)}`}
                </td>
                <td style={{ padding: '8px 12px', color: '#9ca3af' }}>
                  {trip.tonnes === null ? '—' : trip.tonnes.toLocaleString()}
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: isQ ? '#78350f' : '#14532d',
                      color: isQ ? '#fbbf24' : '#86efac',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {trip.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
