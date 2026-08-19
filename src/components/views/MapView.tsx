'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { DatabaseSchema } from '@/types';
import { BOLE_PINNED_LOCATIONS } from '@/lib/pinnedLocations';
import { isToday } from '@/lib/utils';

const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), { ssr: false });

interface MapViewProps {
  db: DatabaseSchema;
}

export function MapView({ db }: MapViewProps) {
  const [types, setTypes] = useState<Set<string>>(new Set(['broker', 'owner', 'property', 'pinned']));
  const [teams, setTeams] = useState<Set<string>>(() => {
    const s = new Set(db.teams.map(t => t.id));
    s.add('unassigned');
    return s;
  });
  const [showTodayOnly, setShowTodayOnly] = useState(false);

  const toggleType = (k: string) => {
    setTypes(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const toggleTeam = (k: string) => {
    setTeams(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  // Build pinned location markers as pseudo-appointments for LeafletMap
  const pinnedAsAppointments = types.has('pinned')
    ? BOLE_PINNED_LOCATIONS.map(pin => ({
        id: pin.id,
        name: pin.name,
        address: `${pin.area}, Bole Subcity`,
        kind: 'owner' as const,
        dt: new Date().toISOString(),
        status: 'Scheduled' as const,
        teamId: '',
        phone: '',
        lat: pin.lat,
        lng: pin.lng,
        isPinned: true,
        contactId: '',
        propId: '',
        notes: ''
      }))
    : [];

  // Filter appointments: optionally show only today's scheduled
  const filteredAppointments = showTodayOnly
    ? db.appointments.filter(a => isToday(a.dt))
    : db.appointments;

  const allAppointments = [...filteredAppointments, ...pinnedAsAppointments];

  return (
    <section className="view on" id="view-map">
      <div className="pagehead rise">
        <div>
          <div className="ph-title">Field Map</div>
          <div className="ph-sub">Pins colored by camera / sales team · diamonds are registered properties · 📌 pinned from Bole gazetteer</div>
        </div>
      </div>

      <div className="mapbar rise" style={{ animationDelay: '.06s' }}>
        {[
          ['broker', 'Broker shoots'],
          ['owner', 'Owner visits'],
          ['property', 'Properties'],
          ['pinned', '📌 Pinned Locations']
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
          />
        </div>

        <div className="maplegend" id="mapLegend">
          <h4>Teams (click to toggle)</h4>
          {db.teams.map(t => (
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

          <h4>Shapes</h4>
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
                background: '#0288D1',
              }}
            />
            📌 Pinned (Bole gazetteer)
          </div>
        </div>
      </div>
    </section>
  );
}
