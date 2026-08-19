'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { DatabaseSchema } from '@/types';

const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), { ssr: false });

interface MapViewProps {
  db: DatabaseSchema;
}

export function MapView({ db }: MapViewProps) {
  const [types, setTypes] = useState<Set<string>>(new Set(['broker', 'owner', 'property']));
  const [teams, setTeams] = useState<Set<string>>(() => {
    const s = new Set(db.teams.map(t => t.id));
    s.add('unassigned');
    return s;
  });

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

  return (
    <section className="view on" id="view-map">
      <div className="pagehead rise">
        <div>
          <div className="ph-title">Field Map</div>
          <div className="ph-sub">Pins colored by camera / sales team · diamonds are registered properties</div>
        </div>
      </div>

      <div className="mapbar rise" style={{ animationDelay: '.06s' }}>
        {[
          ['broker', 'Broker shoots'],
          ['owner', 'Owner visits'],
          ['property', 'Properties']
        ].map(([k, l]) => (
          <button
            key={k}
            className={`fchip ${types.has(k) ? 'on' : ''}`}
            onClick={() => toggleType(k)}
          >
            {l}
          </button>
        ))}
        <span className="chip ch-gray">tiles need internet · pins & scheduling work offline</span>
      </div>

      <div className="mapshell rise" style={{ animationDelay: '.1s' }}>
        <div id="bigMap">
          <LeafletMap
            appointments={db.appointments}
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
        </div>
      </div>
    </section>
  );
}
