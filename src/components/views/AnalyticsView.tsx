'use client';

import React, { useEffect, useState } from 'react';
import { DatabaseSchema } from '@/types';
import { dOff, exportToWordDoc, localYMD } from '@/lib/utils';
import { FU_STATUSES } from './FollowUpsView';

interface AnalyticsViewProps {
  db: DatabaseSchema;
}

export function AnalyticsView({ db }: AnalyticsViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
    return () => cancelAnimationFrame(t);
  }, []);

  const A = db.appointments;
  const P = db.properties;
  const F = db.followups;

  const completedCount = A.filter(a => a.status === 'Completed').length;
  const incompleteCount = A.filter(a => a.status === 'Incomplete').length;
  const totalCompletedOrIncomplete = completedCount + incompleteCount || 1;
  const completionRate = Math.round((completedCount / totalCompletedOrIncomplete) * 100);

  const st = ['Scheduled', 'Confirmed', 'Completed', 'Incomplete', 'Cancelled'];
  const stC: Record<string, string> = {
    Scheduled: '#B8862B',
    Confirmed: '#2E4632',
    Completed: '#8CA383',
    Incomplete: '#B65C3E',
    Cancelled: '#6B7FA3'
  };

  // Last 14 days bars
  let max = 1;
  const days: { d: string; c: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = dOff(-i);
    const c = A.filter(a => localYMD(a.dt) === d).length;
    days.push({ d, c });
    max = Math.max(max, c);
  }

  // Donut chart generator
  function renderDonut(data: { l: string; c: string; v: number }[]) {
    const total = data.reduce((s, d) => s + d.v, 0) || 1;
    const C = 2 * Math.PI * 45;
    let off = 0;

    return (
      <div className="donut-flex">
        <div className="donut-wrap">
          <svg viewBox="0 0 120 120">
            {data.map((d, idx) => {
              const len = Math.max(0, (d.v / total) * C - 1.5);
              const strokeDasharray = `${len} ${C - len}`;
              const strokeDashoffset = -off;
              off += (d.v / total) * C;

              return (
                <circle
                  key={idx}
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke={d.c}
                  strokeWidth="19"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 60 60)"
                />
              );
            })}
          </svg>
          <div className="donut-center">
            <div>
              <b>{data.reduce((s, d) => s + d.v, 0)}</b>
              <span>total</span>
            </div>
          </div>
        </div>

        <div>
          {data.map((d, idx) => (
            <div key={idx} className="dlg-row">
              <span className="sw" style={{ background: d.c }} />
              {d.l}
              <b>{d.v}</b>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Workload
  const tw = db.teams.map(t => ({ t, c: A.filter(a => a.teamId === t.id).length }));
  const tm = Math.max(1, ...tw.map(x => x.c));

  // Top brokers
  const lb = db.brokers
    .map(b => ({ b, c: A.filter(a => a.kind === 'broker' && a.contactId === b.id).length }))
    .filter(x => x.c > 0)
    .sort((a, b) => b.c - a.c)
    .slice(0, 5);
  const lm = Math.max(1, ...lb.map(x => x.c));

  // Incomplete appointments with reasons
  const incompleteList = A.filter(a => a.status === 'Incomplete' && a.incompletionReason);

  // Field Team Member Completion Leaderboard
  const memberPerfMap: Record<string, number> = {};
  A.forEach(a => {
    if (a.status === 'Completed') {
      const names = a.completedByMembers && a.completedByMembers.length > 0 ? a.completedByMembers : [a.name];
      names.forEach(n => {
        memberPerfMap[n] = (memberPerfMap[n] || 0) + 1;
      });
    }
  });

  const memberLeaderboard = Object.entries(memberPerfMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const handleExportWord = () => {
    const cols = ['Metric / Category', 'Value / Details'];
    const rows = [
      ['Total Appointments Booked', String(A.length)],
      ['Completed Appointments', `${completedCount} (${completionRate}%)`],
      ['Incomplete Appointments', `${incompleteCount} (${100 - completionRate}%)`],
      ['Total Active Field Teams', String(db.teams.length)],
      ['Total Approved Properties', String(db.properties.filter(p => (p.approvalStatus || 'Approved') === 'Approved').length)],
      ['Total Approved Brokers', String(db.brokers.filter(b => b.active && (b.approvalStatus || 'Approved') === 'Approved').length)],
      ...memberLeaderboard.map(m => [`Field Member Completed Shoots: ${m.name}`, `${m.count} completed shoot(s)`]),
      ...incompleteList.map(a => [`Incomplete Shoot: ${a.name} (${a.address})`, `Reason: ${a.incompletionReason}`])
    ];
    exportToWordDoc('Das Homes Operations & Field Analytics Report', cols, rows, 'dashomes-analytics-report');
  };

  return (
    <section className="view on" id="view-analytics">
      <div className="pagehead rise">
        <div>
          <div className="ph-title">Analytics & Field Reports</div>
          <div className="ph-sub">Pipeline metrics, completion rates, and incompletion reason tracking</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-ghost" onClick={handleExportWord} title="Export Analytics to Word">
            📄 Export Word Report
          </button>
        </div>
      </div>

      <div className="an-grid" id="anGrid">
        <div className="card rise full">
          <div className="card-h">
            <h3>Field Completion Rate Performance</h3>
          </div>
          <div className="card-b" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ background: 'var(--cream2)', padding: '16px 24px', borderRadius: '12px', border: '1px solid var(--sageline)', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 800, color: completionRate >= 80 ? '#2E4632' : '#B65C3E' }}>
                {completionRate}%
              </div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)' }}>Completion Rate</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span>✓ Completed: <b>{completedCount}</b></span>
                <span>✕ Incomplete: <b>{incompleteCount}</b></span>
              </div>
              <div className="hbar-track" style={{ height: '14px' }}>
                <div className="hbar-fill" style={{ background: '#2E4632', width: `${completionRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card rise full">
          <div className="card-h">
            <h3>Appointments — last 14 days</h3>
          </div>
          <div className="card-b">
            <div className="barwrap">
              {days.map((x, idx) => {
                const targetPct = (x.c / max) * 100;
                return (
                  <div key={idx} className="barcol">
                    <div
                      className="barfill"
                      style={{ height: mounted ? `${targetPct}%` : '0%' }}
                    >
                      <span className="bv">{x.c}</span>
                    </div>
                    <em>{new Date(x.d + 'T00:00').getDate()}</em>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card rise" style={{ animationDelay: '.06s' }}>
          <div className="card-h">
            <h3>Appointments by status</h3>
          </div>
          <div className="card-b">
            {renderDonut(
              st.map(s => ({
                l: s,
                c: stC[s],
                v: A.filter(a => a.status === s).length
              }))
            )}
          </div>
        </div>

        <div className="card rise" style={{ animationDelay: '.1s' }}>
          <div className="card-h">
            <h3>Inventory mix</h3>
          </div>
          <div className="card-b">
            {renderDonut([
              { l: 'For rent', c: '#8CA383', v: P.filter(p => p.listing === 'rent').length },
              { l: 'For sale', c: '#B8862B', v: P.filter(p => p.listing === 'sale').length },
              { l: 'Apartments', c: '#3A6B94', v: P.filter(p => p.type === 'Apartment').length },
              { l: 'Villas', c: '#B65C3E', v: P.filter(p => p.type === 'Villa').length }
            ])}
          </div>
        </div>

        <div className="card rise" style={{ animationDelay: '.14s' }}>
          <div className="card-h">
            <h3>Team workload</h3>
          </div>
          <div className="card-b">
            {tw.map((x, idx) => (
              <div key={idx} className="hbar-row">
                <span className="nm">{x.t.name}</span>
                <div className="hbar-track">
                  <div
                    className="hbar-fill"
                    style={{
                      background: x.t.color,
                      width: mounted ? `${(x.c / tm) * 100}%` : '0%'
                    }}
                  />
                </div>
                <span className="vl">{x.c}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card rise" style={{ animationDelay: '.18s' }}>
          <div className="card-h">
            <h3>Top brokers by bookings</h3>
          </div>
          <div className="card-b">
            {lb.length ? (
              lb.map((x, idx) => (
                <div key={idx} className="hbar-row">
                  <span className="nm">{x.b.name}</span>
                  <div className="hbar-track">
                    <div
                      className="hbar-fill"
                      style={{
                        background: 'var(--pine)',
                        width: mounted ? `${(x.c / lm) * 100}%` : '0%'
                      }}
                    />
                  </div>
                  <span className="vl">{x.c}</span>
                </div>
              ))
            ) : (
              <div className="empty">
                <p>No broker bookings yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="card rise" style={{ animationDelay: '.2s' }}>
          <div className="card-h">
            <h3>Field Member Shoots Completed</h3>
          </div>
          <div className="card-b">
            {memberLeaderboard.length ? (
              memberLeaderboard.map((x, idx) => {
                const maxMem = Math.max(1, memberLeaderboard[0].count);
                return (
                  <div key={idx} className="hbar-row">
                    <span className="nm">{x.name}</span>
                    <div className="hbar-track">
                      <div
                        className="hbar-fill"
                        style={{
                          background: '#2E4632',
                          width: mounted ? `${(x.count / maxMem) * 100}%` : '0%'
                        }}
                      />
                    </div>
                    <span className="vl">{x.count}</span>
                  </div>
                );
              })
            ) : (
              <div className="empty">
                <p>No completed shoots by members yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Incompletion Reasons Tracking Card */}
        <div className="card rise full" style={{ animationDelay: '.22s' }}>
          <div className="card-h">
            <h3>Incompletion Reason Logs (Field Team Feedbacks)</h3>
          </div>
          <div className="card-b">
            {incompleteList.length ? (
              incompleteList.map(a => (
                <div key={a.id} style={{ padding: '10px 14px', background: '#fdf2f0', borderRadius: '8px', borderLeft: '4px solid #B65C3E', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <b style={{ color: '#2E4632' }}>{a.name} — {a.address}</b>
                    <span style={{ fontSize: '11px', color: '#B65C3E', fontWeight: 700 }}>Incomplete</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#333' }}>
                    <b>Reason:</b> {a.incompletionReason}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty">
                <p>No incompletions reported by field teams.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
