'use client';

import { useState, useMemo, useRef } from 'react';
import { THEME } from '@/lib/theme';
import { parseTripsCSV, CSV_TEMPLATE } from '@/lib/csv';
import { computeFromTrips } from '@/lib/data';

function Stat({ label, value, color }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 10, color: THEME.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  );
}

export default function UploadModal({ open, source, onClose, onIngest, onLoadSample, onConnectUrl }) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState(source?.kind === 'url' ? source.url : '');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef(null);

  const parsed = useMemo(() => (text.trim() ? parseTripsCSV(text) : null), [text]);
  const preview = useMemo(() => {
    if (!parsed || parsed.errors.length || !parsed.trips.length) return null;
    try { return computeFromTrips(parsed.trips); } catch { return null; }
  }, [parsed]);

  if (!open) return null;

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ''));
    reader.readAsText(f);
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lumnia-trips-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const canIngest = preview && preview.kpis.tripsClean > 0;
  const labelStyle = { fontSize: 11, fontWeight: 700, color: THEME.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(3,7,14,0.72)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 580, backgroundColor: THEME.panel,
          border: `1px solid ${THEME.border}`, borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: THEME.nav }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Connect corridor data</div>
            <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
              Lumnia validates, ingests, and recomputes the whole environment from your trips.
            </div>
          </div>
          <button onClick={onClose} style={{ fontSize: 20, color: THEME.muted, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Live URL source */}
          <div>
            <div style={labelStyle}>① Connect a live source (recommended)</div>
            <p style={{ fontSize: 11.5, color: THEME.muted, lineHeight: 1.5, marginBottom: 8 }}>
              Paste a published CSV URL (e.g. a Google Sheet → File → Share → Publish to web → CSV).
              Lumnia polls it and the dashboard moves whenever the sheet changes — no rebuild.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://docs.google.com/.../pub?output=csv"
                style={{
                  flex: 1, padding: '9px 12px', fontSize: 12, color: THEME.text,
                  backgroundColor: THEME.panelDark, border: `1px solid ${THEME.border}`, borderRadius: 6, outline: 'none',
                }}
              />
              <button
                onClick={() => url.trim() && onConnectUrl(url.trim())}
                disabled={!url.trim()}
                style={{
                  padding: '9px 16px', fontSize: 12, fontWeight: 700, borderRadius: 6,
                  backgroundColor: url.trim() ? THEME.green : THEME.border,
                  color: url.trim() ? '#06281e' : THEME.faint, whiteSpace: 'nowrap',
                }}
              >
                Connect live
              </button>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: THEME.border }} />

          {/* File / paste upload */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={labelStyle}>② Upload or paste a CSV</span>
              <button onClick={downloadTemplate} style={{ fontSize: 11, color: THEME.greenBright, fontWeight: 600 }}>
                ↓ Download template
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display: 'none' }} />
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: '9px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                  border: `1px solid ${THEME.border}`, color: THEME.text, backgroundColor: THEME.panelDark,
                }}
              >
                Choose file…
              </button>
              <span style={{ fontSize: 11.5, color: THEME.muted, alignSelf: 'center' }}>
                {fileName || 'tripId, route, week, delay, cpt, tonnes'}
              </span>
            </div>

            <textarea
              value={text} onChange={e => { setText(e.target.value); setFileName(''); }}
              placeholder="…or paste CSV rows here"
              rows={5}
              style={{
                width: '100%', padding: '10px 12px', fontSize: 12, fontFamily: 'monospace',
                color: THEME.text, backgroundColor: THEME.panelDark, border: `1px solid ${THEME.border}`,
                borderRadius: 6, outline: 'none', resize: 'vertical',
              }}
            />

            {/* Parse errors */}
            {parsed?.errors?.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 11.5, color: THEME.critical, lineHeight: 1.5 }}>
                {parsed.errors.map((er, i) => <div key={i}>⚠ {er}</div>)}
              </div>
            )}

            {/* Validation preview */}
            {preview && (
              <div style={{ marginTop: 12, padding: 14, backgroundColor: THEME.panelDark, border: `1px solid ${THEME.border}`, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: THEME.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Discovery &amp; validation
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Stat label="Ingested" value={preview.kpis.tripsIngested} color={THEME.text} />
                  <Stat label="Clean" value={preview.kpis.tripsClean} color={THEME.greenBright} />
                  <Stat label="Quarantined" value={preview.kpis.tripsQuarantined} color={THEME.gold} />
                  <Stat label="Routes" value={Object.keys(preview.routeAnalyses).length} color={THEME.text} />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <button onClick={() => { onLoadSample(); }} style={{ fontSize: 12, color: THEME.muted, fontWeight: 600 }}>
              Reset to sample dataset
            </button>
            <button
              onClick={() => canIngest && onIngest(parsed.trips)}
              disabled={!canIngest}
              style={{
                padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 6,
                backgroundColor: canIngest ? THEME.gold : THEME.border,
                color: canIngest ? '#1a1400' : THEME.faint,
              }}
            >
              Ingest dataset →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
