'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DatabaseSchema, Session, ViewId } from '@/types';
import { daysUntil, fmtD, fmtTime, isToday, relTime, todayYMD } from '@/lib/utils';
import { Icon } from '@/lib/icons';

const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), { ssr: false });

interface DashboardViewProps {
  db: DatabaseSchema;
  session: Session;
  onNavigate: (view: ViewId) => void;
}

export function DashboardView({ db, session, onNavigate }: DashboardViewProps) {
  const [counts, setCounts] = useState<{ [key: string]: number }>({});

  const firstName = session.name.split(' ')[0];
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  const todayShoots = db.appointments
    .filter(a => isToday(a.dt))
    .sort((a, b) => new Date(a.dt).getTime() - new Date(b.dt).getTime());

  const weekShootsCount = db.appointments.filter(
    a =>
      (new Date(a.dt).getTime() - new Date(todayYMD() + 'T00:00').getTime()) / 86400000 < 7 &&
      new Date(a.dt) >= new Date(todayYMD() + 'T00:00')
  ).length;

  const overdueCount = db.followups.filter(
    f => f.next && !['Closed - Won', 'Lost'].includes(f.status) && daysUntil(f.next) < 0
  ).length;

  const openFU = db.followups.filter(f => !['Closed - Won', 'Lost'].includes(f.status)).length;
  const activeBrokersCount = db.brokers.filter(b => b.active).length;
  const totalPropertiesCount = db.properties.length;
  const rentPropertiesCount = db.properties.filter(p => p.listing === 'rent').length;
  const salePropertiesCount = db.properties.filter(p => p.listing === 'sale').length;
  const completionRate = db.appointments.length
    ? Math.round((db.appointments.filter(a => a.status === 'Completed').length / db.appointments.length) * 100)
    : 0;

  const kpis = [
    { label: 'Active Brokers', val: activeBrokersCount, sub: `of ${db.brokers.length} registered`, icon: 'users', color: 'var(--pine)' },
    { label: 'Shoots This Week', val: weekShootsCount, sub: 'scheduled + confirmed', icon: 'cam', color: 'var(--gold)' },
    { label: 'Properties Listed', val: totalPropertiesCount, sub: `${rentPropertiesCount} rent · ${salePropertiesCount} sale`, icon: 'home', color: 'var(--blue)' },
    { label: 'Open Follow-Ups', val: openFU, sub: overdueCount ? `${overdueCount} overdue ⚠` : 'all on track', icon: 'phone', color: overdueCount ? 'var(--clay)' : 'var(--pine)' },
    { label: 'Field Teams', val: db.teams.length, sub: 'color-coded on map', icon: 'grid', color: 'var(--pine)' },
    { label: 'Completion Rate', val: completionRate, sub: '% of all appointments', icon: 'chart', color: 'var(--gold)' }
  ];

  useEffect(() => {
    // Count-up animation
    const startTime = performance.now();
    const duration = 900;

    const animate = (now: number) => {
      const p = Math.min(1, (now - startTime) / duration);
      const easeP = 1 - Math.pow(1 - p, 3);
      const newCounts: { [key: string]: number } = {};

      kpis.forEach((k, idx) => {
        newCounts[idx] = Math.round(k.val * easeP);
      });

      setCounts(newCounts);

      if (p < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [db]);

  const teamById = (id: string) => db.teams.find(t => t.id === id);

  const dueFollowups = db.followups
    .filter(f => f.next && !['Closed - Won', 'Lost'].includes(f.status))
    .sort((a, b) => a.next.localeCompare(b.next))
    .slice(0, 5);

  return (
    <section className="view on" id="view-dashboard">
      <div className="greet rise">
        <h2>
          {greeting}, <em>{firstName}.</em>
        </h2>
        <p>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          {` — ${todayShoots.length} shoot(s) on today’s board.`}
        </p>
      </div>

      <div className="kpis rise" style={{ animationDelay: '.06s' }}>
        {kpis.map((k, idx) => (
          <div key={idx} className="kpi" style={{ '--kc': k.color } as React.CSSProperties}>
            <Icon name={k.icon} size={22} />
            <div className="lbl">{k.label}</div>
            <div className="num">{(counts[idx] ?? 0).toLocaleString()}</div>
            <div className="sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="dash-cols">
        <div className="card rise" style={{ animationDelay: '.12s' }}>
          <div className="card-h">
            <h3>📷 Today’s Shoot Schedule</h3>
            <div className="spacer" />
            <span className="count-pill">{todayShoots.length}</span>
          </div>
          <div className="card-b">
            {todayShoots.length ? (
              todayShoots.map(a => {
                const t = teamById(a.teamId);
                return (
                  <div key={a.id} className="mini-row">
                    <span className="t">{fmtTime(a.dt)}</span>
                    <span className="dot" style={{ background: t ? t.color : '#9AA392' }} />
                    <div>
                      <b>
                        {a.name} <span className={`src-chip ${a.kind === 'broker' ? 'src-broker' : 'src-owner'}`}>{a.kind}</span>
                      </b>
                      <div className="addrline">
                        <Icon name="pin" size={11} /> {a.address} · <span className={`chip s-${a.status}`} style={{ border: 'none', padding: '1px 7px' }}>{a.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty">
                <Icon name="cam" size={40} />
                <p>No shoots today — book one from Schedule.</p>
              </div>
            )}
          </div>
        </div>

        <div className="card rise" style={{ animationDelay: '.18s' }}>
          <div className="card-h">
            <h3>⏰ Follow-Ups Due</h3>
            <div className="spacer" />
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('followups')}>
              Open tracker →
            </button>
          </div>
          <div className="card-b">
            {dueFollowups.length ? (
              dueFollowups.map(f => {
                const d = daysUntil(f.next);
                return (
                  <div key={f.id} className={`due-row ${d < 0 ? 'over' : ''}`}>
                    <div>
                      <b>{f.name}</b>
                      <small>{f.property} · {f.action}</small>
                    </div>
                    <div className="when">{d < 0 ? `OVERDUE ${-d}d` : d === 0 ? 'TODAY' : fmtD(f.next)}</div>
                  </div>
                );
              })
            ) : (
              <div className="empty">
                <p>Nothing due — pipeline is clear.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dash-cols">
        <div className="card rise" style={{ animationDelay: '.24s' }}>
          <div className="card-h">
            <h3>🗺 Field Overview</h3>
            <div className="spacer" />
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('map')}>
              Full map →
            </button>
          </div>
          <div id="miniMap">
            <LeafletMap isMiniMap appointments={db.appointments} properties={db.properties} teams={db.teams} />
          </div>
        </div>

        <div className="card rise" style={{ animationDelay: '.3s' }}>
          <div className="card-h">
            <h3>Activity</h3>
          </div>
          <div className="card-b" style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {db.activity.map((a, idx) => (
              <div key={idx} className="act-row">
                <span className="adot" />
                <div>
                  {a.text}
                  <time>{relTime(a.ts)}</time>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
