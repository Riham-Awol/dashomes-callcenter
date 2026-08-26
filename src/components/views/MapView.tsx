'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { DatabaseSchema, Session } from '@/types';
import { BOLE_PINNED_LOCATIONS, BOLE_POLYGONS, COLOR_LEGEND, COLOR_LEGEND_FALLBACK } from '@/lib/pinnedLocations';
import { isToday } from '@/lib/utils';

const colorLabel = (color?: string) =>
  COLOR_LEGEND.find(c => c.color.toLowerCase() === (color || '').toLowerCase())?.label || COLOR_LEGEND_FALLBACK;

const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), { ssr: false });

interface MapViewProps {
  db: DatabaseSchema;
  session?: Session | null;
  focusedLocation?: { lat: number; lng: number; address?: string } | null;
}

export function MapView({ db, session, focusedLocation }: MapViewProps) {
  const [types, setTypes] = useState<Set<string>>(new Set(['broker', 'owner', 'property', 'pinned', 'zones']));

  const isFieldAgent = session?.role === 'Team Member (Field Agent)';

  // Find logged in team if field agent
  const userTeam = db.teams.find(
    t =>
      (session?.teamId && t.id === session.teamId) ||
      t.name.toLowerCase() === session?.name?.toLowerCase() ||
      session?.u?.toLowerCase().includes(t.id.toLowerCase()) ||
      (session?.u === 'team1' && t.id === 't1') ||
      (session?.u === 'team2' && t.id === 't2') ||
      (session?.u === 'team3' && t.id === 't3') ||
      (session?.u === 'team4' && t.id === 't4') ||
      t.members?.some(m => m.name === session?.name)
  );

  const [teams, setTeams] = useState<Set<string>>(() => {
    if (isFieldAgent && userTeam) {
      return new Set([userTeam.id]);
    }
    const s = new Set(db.teams.map(t => t.id));
    s.add('unassigned');
    return s;
  });

  const [showTodayOnly, setShowTodayOnly] = useState(isFieldAgent);
  const [drawRoutePath, setDrawRoutePath] = useState(true);

  // Pinned-locations directory: search + local map focus
  const [pinQuery, setPinQuery] = useState('');
  const [pinFocus, setPinFocus] = useState<{ lat: number; lng: number; address?: string } | null>(null);

  // Live count of pins per colour, for the legend descriptions
  const legendCounts = useMemo(() => {
    const m = new Map<string, number>();
    BOLE_PINNED_LOCATIONS.forEach(p => {
      const c = (p.color || '#0288D1').toLowerCase();
      m.set(c, (m.get(c) || 0) + 1);
    });
    return m;
  }, []);

  // Directory list — filtered by search (name / location / phone) and sorted
  // alphabetically by location (area), then by name.
  const directory = useMemo(() => {
    const q = pinQuery.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    const rows = BOLE_PINNED_LOCATIONS.filter(p => {
      if (!q) return true;
      const nameHit = p.name.toLowerCase().includes(q);
      const locHit = (p.area || '').toLowerCase().includes(q) || (p.address || '').toLowerCase().includes(q);
      const phoneHit = !!digits && (p.phone || '').replace(/\D/g, '').includes(digits);
      return nameHit || locHit || phoneHit;
    });
    rows.sort((a, b) => {
      const aa = (a.address || '').trim();
      const bb = (b.address || '').trim();
      // Pins without an address sort to the end, then alphabetical by address, then name.
      if (!aa && bb) return 1;
      if (aa && !bb) return -1;
      const addr = aa.localeCompare(bb, undefined, { sensitivity: 'base' });
      return addr !== 0 ? addr : a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
    return rows;
  }, [pinQuery]);

  const toggleType = (k: string) => {
    setTypes(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const toggleTeam = (k: string) => {
    if (isFieldAgent) return; // Field agents locked to their own team
    setTeams(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  // Pinned locations & zone polygons cloned from the source map (rendered by
  // LeafletMap directly, with their own colours — not mixed into the route).
  const pinnedForMap = types.has('pinned') ? BOLE_PINNED_LOCATIONS : [];
  const polygonsForMap = types.has('zones') ? BOLE_POLYGONS : [];

  // A directory click focuses the map; an external redirect (prop) still wins.
  const effectiveFocus = focusedLocation || pinFocus;

  // Filter appointments: optionally show only today's scheduled, and filter by team for field agents
  let filteredAppointments = showTodayOnly
    ? db.appointments.filter(a => isToday(a.dt))
    : db.appointments;

  if (isFieldAgent && userTeam) {
    filteredAppointments = filteredAppointments.filter(a => a.teamId === userTeam.id);
  }

  const allAppointments = filteredAppointments;

  return (
    <section className="view on" id="view-map">
      <div className="pagehead rise">
        <div>
          <div className="ph-title">
            {isFieldAgent && userTeam ? `🚗 ${userTeam.name} — Field Map` : 'Field Map'}
          </div>
          <div className="ph-sub">
            {isFieldAgent && userTeam
              ? `Displaying pins & daily shortest route path for ${userTeam.name} only.`
              : 'Pins colored by team · numbered sequence shows shortest route connecting all scheduled stops'}
          </div>
        </div>
      </div>

      <div className="mapbar rise" style={{ animationDelay: '.06s' }}>
        {[
          ['broker', 'Broker shoots'],
          ['owner', 'Owner visits'],
          ['property', 'Properties'],
          ['pinned', '📌 Pinned Locations'],
          ['zones', '🗺️ Bole Zones']
        ].map(([k, l]) => (
          <button
            key={k}
            className={`fchip ${types.has(k) ? 'on' : ''}`}
            onClick={() => toggleType(k)}
          >
            {l}
          </button>
        ))}

        <button
          className={`fchip ${showTodayOnly ? 'on' : ''}`}
          onClick={() => setShowTodayOnly(prev => !prev)}
          style={{ borderColor: showTodayOnly ? 'var(--gold)' : undefined, color: showTodayOnly ? 'var(--gold)' : undefined }}
        >
          📅 Today's Schedule Only
        </button>

        <button
          className={`fchip ${drawRoutePath ? 'on' : ''}`}
          onClick={() => setDrawRoutePath(prev => !prev)}
          style={{ borderColor: drawRoutePath ? '#2E4632' : undefined, color: drawRoutePath ? '#2E4632' : undefined }}
        >
          🛣️ Shortest Daily Route Path
        </button>

        <span className="chip ch-gray">tiles need internet · pins & scheduling work offline</span>
      </div>

      <div className="mapshell rise" style={{ animationDelay: '.1s' }}>
        <div id="bigMap">
          <LeafletMap
            appointments={allAppointments}
            properties={db.properties}
            teams={db.teams}
            filterTypes={types}
            filterTeams={teams}
            focusedLocation={effectiveFocus}
            drawRoutePath={drawRoutePath}
            pinnedLocations={pinnedForMap}
            polygons={polygonsForMap}
          />
        </div>

        <div className="maplegend" id="mapLegend">
          <h4>{isFieldAgent ? 'Your Active Team' : 'Teams (click to toggle)'}</h4>
          {db.teams
            .filter(t => !isFieldAgent || (userTeam && t.id === userTeam.id))
            .map(t => (
              <div
                key={t.id}
                className={`lg-item ${!teams.has(t.id) ? 'off' : ''}`}
                onClick={() => toggleTeam(t.id)}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: t.color
                  }}
                />
                {t.name}
              </div>
            ))}

          {!isFieldAgent && (
            <div
              className={`lg-item ${!teams.has('unassigned') ? 'off' : ''}`}
              onClick={() => toggleTeam('unassigned')}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#9AA392'
                }}
              />
              Unassigned
            </div>
          )}

          <h4>Route & Shapes</h4>
          <div className="lg-item" style={{ cursor: 'default' }}>
            <span
              style={{
                display: 'inline-block',
                width: '18px',
                height: '3px',
                background: '#B8860B',
                borderRadius: '2px',
                marginRight: '6px'
              }}
            />
            Shortest Daily Route (1→15)
          </div>
          <div className="lg-item" style={{ cursor: 'default' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50% 50% 50% 0',
                background: 'var(--pine)',
                transform: 'rotate(-45deg)'
              }}
            />
            Appointment / visit
          </div>
          <div className="lg-item" style={{ cursor: 'default' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50% 50% 50% 0',
                background: '#8C6A1F',
                transform: 'rotate(-45deg)'
              }}
            />
            Registered property
          </div>
          <div className="lg-item" style={{ cursor: 'default' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'conic-gradient(#0288D1, #FFEA00, #C2185B, #558B2F, #9C27B0, #0288D1)'
              }}
            />
            📌 Pinned locations (source-map colors)
          </div>
          <div className="lg-item" style={{ cursor: 'default' }}>
            <span
              style={{
                display: 'inline-block',
                width: '14px',
                height: '10px',
                borderRadius: '3px',
                background: 'rgba(57,73,171,0.18)',
                border: '1.5px solid #3949AB'
              }}
            />
            🗺️ Bole zones (named areas)
          </div>

          <h4>Pin colours</h4>
          {COLOR_LEGEND.filter(c => (legendCounts.get(c.color.toLowerCase()) || 0) > 0).map(c => (
            <div key={c.color} className="lg-item" style={{ cursor: 'default', alignItems: 'flex-start' }} title={c.label}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: c.color,
                  border: c.color.toLowerCase() === '#ffffff' ? '1px solid var(--sageline)' : 'none',
                  marginTop: '3px',
                  flexShrink: 0
                }}
              />
              <span style={{ fontSize: '11.5px', lineHeight: 1.35 }}>
                {c.label} <span style={{ color: 'var(--muted)' }}>({legendCounts.get(c.color.toLowerCase()) || 0})</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pinned Locations Directory — searchable & sorted by location */}
      <div className="card rise" style={{ animationDelay: '.14s', marginTop: '16px' }}>
        <div className="card-h">
          <h3>📇 Pinned Locations Directory</h3>
          <div className="spacer" />
          <span className="count-pill">{directory.length}</span>
        </div>
        <div className="card-b">
          <input
            className="inp"
            type="search"
            value={pinQuery}
            onChange={e => setPinQuery(e.target.value)}
            placeholder="Search by name, location or phone number…"
            style={{ marginBottom: '10px' }}
          />
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '10px' }}>
            Sorted alphabetically by address · click a row to centre it on the map
          </div>
          <div style={{ maxHeight: '460px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {directory.length ? (
              directory.slice(0, 400).map(p => (
                <div
                  key={p.id}
                  className="pin-dir-row"
                  onClick={() => setPinFocus({ lat: p.lat, lng: p.lng, address: p.address || p.name })}
                  title={`${colorLabel(p.color)} — click to view on map`}
                >
                  <span className="pin-dir-dot" style={{ background: p.color || '#0288D1', border: (p.color || '').toLowerCase() === '#ffffff' ? '1px solid var(--sageline)' : 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--pine)', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📍 {p.area}{p.address ? ` · ${p.address}` : ''}{p.phone ? ` · 📞 ${p.phone}` : ''}
                    </div>
                  </div>
                  <span className="chip ch-gray" style={{ fontSize: '9.5px', flexShrink: 0 }}>{colorLabel(p.color)}</span>
                </div>
              ))
            ) : (
              <div className="empty"><p>No pinned locations match “{pinQuery}”.</p></div>
            )}
          </div>
          {directory.length > 400 && (
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px', textAlign: 'center' }}>
              Showing first 400 of {directory.length} — refine your search to narrow the list.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
