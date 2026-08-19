'use client';

import React, { useEffect, useState } from 'react';
import { VIEWS_META } from './Sidebar';
import { DatabaseSchema, Session, ViewId } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';

interface TopbarProps {
  db: DatabaseSchema;
  session: Session;
  currentView: ViewId;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewAppointment: () => void;
}

export function Topbar({ db, session, currentView, searchQuery, onSearchChange, onNewAppointment }: TopbarProps) {
  const [clock, setClock] = useState('');

  const meta = VIEWS_META.find(x => x[0] === currentView) || VIEWS_META[0];

  const activeTeam = session.teamId ? db.teams.find(t => t.id === session.teamId) : null;
  const activeMembersStr = activeTeam?.members?.length
    ? activeTeam.members.map(m => m.name).join(', ')
    : activeTeam?.lead || '';

  useEffect(() => {
    const tickClock = () => {
      const d = new Date();
      setClock(
        d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
          ' · ' +
          d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };

    tickClock();
    const interval = setInterval(tickClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !/input|textarea|select/i.test((document.activeElement?.tagName || ''))) {
        e.preventDefault();
        const searchEl = document.getElementById('gSearch');
        if (searchEl) searchEl.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header id="topbar">
      <div>
        <h1 id="topTitle">{meta[1]}</h1>
        <div className="sub" id="topSub">
          {meta[3]}
        </div>
      </div>

      <div className="searchwrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          id="gSearch"
          placeholder="Search this page…  ( / )"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      {activeTeam && (
        <div className="clockchip mono" style={{ fontSize: '11px', background: '#2E4632', color: '#ffffff', borderColor: '#2E4632' }}>
          🚗 {activeTeam.name} Members Today: <b>{activeMembersStr}</b>
        </div>
      )}

      <div className="clockchip mono" id="clockChip">
        {clock || '—'}
      </div>

      <div className="clockchip mono" style={{ fontSize: '11px', color: isSupabaseConfigured() ? '#10b981' : '#f59e0b', borderColor: 'currentColor' }}>
        {isSupabaseConfigured() ? '☁ Supabase Cloud' : '💾 Local Storage'}
      </div>

      {['System Administrator', 'Call Center Operator'].includes(session.role) && (
        <button className="btn btn-gold" onClick={onNewAppointment}>
          ＋ New Appointment
        </button>
      )}
    </header>
  );
}
