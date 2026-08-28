'use client';

import React, { useMemo, useState } from 'react';
import { Appointment, AppointmentStatus, DatabaseSchema, Session } from '@/types';
import { dOff, fmtTime, generateTeamDaily15Routes, localYMD, pad, TeamDaily15Route, todayYMD, uid } from '@/lib/utils';
import { Icon } from '@/lib/icons';
import { Modal } from '@/components/ui/Modal';
import { BOLE_PINNED_LOCATIONS } from '@/lib/pinnedLocations';

interface ScheduleViewProps {
  db: DatabaseSchema;
  session: Session;
  onOpenApptModal: (appt?: Appointment | null, prefill?: Partial<Appointment>) => void;
  onUpdateDatabase: (updater: (draft: DatabaseSchema) => void) => void;
  onToast: (msg: string, isErr?: boolean) => void;
  onAskConfirm: (msg: string, onConfirm: () => void) => void;
  onNavigateMap?: (lat?: number | null, lng?: number | null, address?: string) => void;
}

export function ScheduleView({
  db,
  session,
  onOpenApptModal,
  onUpdateDatabase,
  onToast,
  onAskConfirm,
  onNavigateMap
}: ScheduleViewProps) {
  const [calCur, setCalCur] = useState<Date>(() => new Date());
  const [selDay, setSelDay] = useState<string>(() => todayYMD());

  // Filter for Team selection (Operators/Admins can filter, Field Agents locked to their own team)
  const [selectedTeamIdFilter, setSelectedTeamIdFilter] = useState<string>('all');

  // Execution Modal state
  const [activeAppt, setActiveAppt] = useState<Appointment | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'Completed' | 'Incomplete'>('Completed');
  const [incompletionReason, setIncompletionReason] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Detailed Visit View Modal state
  const [detailItem, setDetailItem] = useState<{
    item: TeamDaily15Route['items'][0];
    team: DatabaseSchema['teams'][0];
  } | null>(null);

  const daily15Routes = useMemo(
    () => generateTeamDaily15Routes(db.appointments, db.properties, db.teams, BOLE_PINNED_LOCATIONS),
    [db.appointments, db.properties, db.teams]
  );

  const isFieldAgent = session.role === 'Team Member (Field Agent)';
  const isOperator = session.role === 'Call Center Operator' || session.role === 'System Administrator';

  // Identify user's team if logged in as a field agent / team member
  const userTeam = db.teams.find(
    t =>
      (session.teamId && t.id === session.teamId) ||
      t.name.toLowerCase() === session.name.toLowerCase() ||
      session.u.toLowerCase().includes(t.id.toLowerCase()) ||
      (session.u === 'team1' && t.id === 't1') ||
      (session.u === 'team2' && t.id === 't2') ||
      (session.u === 'team3' && t.id === 't3') ||
      (session.u === 'team4' && t.id === 't4') ||
      t.members?.some(m => m.name === session.name)
  );

  // Filter routes: Field Agents see ONLY their own team schedule
  const visibleRoutes = isFieldAgent && userTeam
    ? daily15Routes.filter(rt => rt.team.id === userTeam.id)
    : selectedTeamIdFilter !== 'all'
    ? daily15Routes.filter(rt => rt.team.id === selectedTeamIdFilter)
    : daily15Routes;

  const teamById = (id: string) => db.teams.find(t => t.id === id);
  const propById = (id: string) => db.properties.find(p => p.id === id);

  const y = calCur.getFullYear();
  const m = calCur.getMonth();
  const monthTitle = calCur.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const startDow = new Date(y, m, 1).getDay();

  const apptsOn = (ymd: string) =>
    db.appointments.filter(a => localYMD(a.dt) === ymd).sort((a, b) => a.dt.localeCompare(b.dt));

  const dayList = apptsOn(selDay);
  const selDateObj = new Date(selDay + 'T00:00');
  const dayTitle = isNaN(selDateObj.getTime())
    ? selDay
    : selDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const handlePrev = () => setCalCur(new Date(y, m - 1, 1));
  const handleNext = () => setCalCur(new Date(y, m + 1, 1));
  const handleToday = () => {
    setCalCur(new Date());
    setSelDay(todayYMD());
  };

  const handleDayClick = (ymd: string, dateObj: Date) => {
    setSelDay(ymd);
    setCalCur(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1));
  };

  // Open Completion / Incompletion status modal for an appointment or route item
  const handleOpenStatusModal = (
    itemOrAppt: Appointment | (TeamDaily15Route['items'][0] & { teamId?: string }),
    status: 'Completed' | 'Incomplete',
    teamId?: string
  ) => {
    let appt: Appointment;
    const targetTeamId = ('teamId' in itemOrAppt && itemOrAppt.teamId) ? itemOrAppt.teamId : (teamId || userTeam?.id || db.teams[0]?.id);

    if ('originalAppointment' in itemOrAppt && itemOrAppt.originalAppointment) {
      appt = itemOrAppt.originalAppointment;
    } else if ('dt' in itemOrAppt && 'contactId' in itemOrAppt) {
      appt = itemOrAppt as Appointment;
    } else {
      const it = itemOrAppt as TeamDaily15Route['items'][0];
      appt = {
        id: it.id,
        name: it.contactName || it.title,
        address: it.address,
        kind: 'owner',
        dt: `${todayYMD()}T${it.time?.replace(' AM', ':00').replace(' PM', ':00') || '10:00:00'}`,
        status: (it.status as AppointmentStatus) || 'Scheduled',
        teamId: targetTeamId,
        phone: it.phone || '+251 91 122 3344',
        notes: it.notes || '',
        lat: it.lat,
        lng: it.lng,
        contactId: '',
        propId: ''
      };
    }

    setActiveAppt(appt);
    setTargetStatus(status);
    setIncompletionReason('');
    const team = teamById(appt.teamId);
    setSelectedMembers(team?.members?.map(m => m.name) || []);
    setStatusModalOpen(true);
    setDetailItem(null);
  };

  const handleSaveStatusUpdate = () => {
    if (!activeAppt) return;

    if (targetStatus === 'Incomplete' && !incompletionReason.trim()) {
      return onToast('Mandatory reason for incompletion is required.', true);
    }

    onUpdateDatabase(draft => {
      let appt = draft.appointments.find(a => a.id === activeAppt.id);
      if (!appt) {
        appt = { ...activeAppt };
        draft.appointments.push(appt);
      }

      appt.status = targetStatus;

      if (targetStatus === 'Incomplete') {
        appt.incompletionReason = incompletionReason.trim();

        // AUTOMATIC WORKFLOW: Route incomplete appointment back to Call Center Operator Follow-Up queue
        draft.followups.unshift({
          id: uid(),
          doc: todayYMD(),
          name: appt.name,
          phone: appt.phone || '+251 91 100 2233',
          property: appt.address,
          status: 'Waiting for manager approval',
          next: dOff(1),
          action: `[INCOMPLETE REASON]: ${incompletionReason.trim()} (Field Team: ${session.name})`,
          priority: 'High'
        });

        if (!draft.notifications) draft.notifications = [];
        draft.notifications.unshift({
          id: uid(),
          ts: Date.now(),
          title: `⚠ Incomplete Visit: ${appt.name}`,
          message: `Field team marked visit as Incomplete. Reason: "${incompletionReason.trim()}". Routed to Operator Follow-Up queue.`,
          type: 'incomplete',
          read: false
        });

        draft.activity.unshift({
          ts: Date.now(),
          text: `Field Team marked ${appt.name}'s visit as INCOMPLETE. Reason: ${incompletionReason.trim()}`
        });
      } else {
        appt.completedByMembers = selectedMembers;

        // Completed shoots are NOT turned into follow-ups. Follow-ups are only
        // created by the call operator, or automatically when a team marks a
        // shoot Incomplete (handled in the branch above).
        if (!draft.notifications) draft.notifications = [];
        draft.notifications.unshift({
          id: uid(),
          ts: Date.now(),
          title: `✓ Shoot Completed: ${appt.name}`,
          message: `Completed by ${selectedMembers.join(', ') || session.name}. Moved to Clients section.`,
          type: 'completed',
          read: false
        });

        draft.activity.unshift({
          ts: Date.now(),
          text: `Field Team completed ${appt.name}'s shoot at ${appt.address}. Archived in Clients.`
        });
      }
    });

    setStatusModalOpen(false);
    onToast(
      targetStatus === 'Completed'
        ? 'Shoot marked Completed & moved to Clients section ✓'
        : 'Incompletion logged & routed to Operator Follow-Ups ⚠'
    );
  };

  const handleAddressClick = (lat?: number | null, lng?: number | null, address?: string) => {
    if (onNavigateMap) {
      onNavigateMap(lat, lng, address);
    }
  };

  // Manual Add Schedule Modal State (for Manager Akrem / Operator / Admin)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manTeamId, setManTeamId] = useState('');
  const [manTitle, setManTitle] = useState('');
  const [manAddress, setManAddress] = useState('');
  const [manPhone, setManPhone] = useState('');
  const [manTime, setManTime] = useState('10:00 AM');
  const [manNotes, setManNotes] = useState('');
  const [manDate, setManDate] = useState(todayYMD());

  const canManageSchedule = session.role === 'System Administrator' || session.role === 'Property & Broker Manager' || session.role === 'Call Center Operator';

  const handleSaveManualSchedule = () => {
    if (!manTitle.trim() || !manAddress.trim()) {
      return onToast('Visit title and address are required.', true);
    }
    const targetTeam = db.teams.find(t => t.id === manTeamId) || db.teams[0];
    if (!targetTeam) {
      return onToast('Please select a team.', true);
    }

    onUpdateDatabase(draft => {
      draft.appointments.push({
        id: uid(),
        name: manTitle.trim(),
        address: manAddress.trim(),
        phone: manPhone.trim() || '+251 91 100 2233',
        kind: 'owner',
        dt: `${manDate}T${manTime.includes(':') ? manTime.replace(' AM', ':00').replace(' PM', ':00') : '10:00:00'}`,
        status: 'Scheduled',
        teamId: targetTeam.id,
        contactId: '',
        propId: '',
        notes: manNotes.trim() || 'Manual schedule assignment by manager',
        isShoot: true,
        assignedMembersSnapshot: targetTeam.members || []
      });

      draft.activity.unshift({
        ts: Date.now(),
        text: `Manual Schedule Entry Added by ${session.name} for ${targetTeam.name}: ${manTitle.trim()} at ${manAddress.trim()}`
      });
    });

    setIsManualModalOpen(false);
    onToast(`Manual schedule visit added for ${targetTeam.name} ✓`);
  };

  return (
    <section className="view on" id="view-schedule">
      <div className="pagehead rise">
        <div>
          <div className="ph-title">
            {isFieldAgent && userTeam ? `🚗 ${userTeam.name} — Daily Field Route` : 'Daily Field Route & Shoot Schedule'}
          </div>
          <div className="ph-sub">
            {isFieldAgent && userTeam
              ? `Team View — Displaying booked shoots for ${userTeam.name} only. Click address to redirect to Field Map.`
              : 'Cluster-assigned 15 visits per team · Click any item for details & map redirect'}
          </div>
        </div>
        <div className="ph-actions">
          {!isFieldAgent && (
            <span className="chiprow">
              <button
                className={`fchip ${selectedTeamIdFilter === 'all' ? 'on' : ''}`}
                onClick={() => setSelectedTeamIdFilter('all')}
              >
                All Teams
              </button>
              {db.teams.map(t => (
                <button
                  key={t.id}
                  className={`fchip ${selectedTeamIdFilter === t.id ? 'on' : ''}`}
                  onClick={() => setSelectedTeamIdFilter(t.id)}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: t.color,
                      marginRight: '6px'
                    }}
                  />
                  {t.name}
                </button>
              ))}
            </span>
          )}
          <button className="btn btn-sec" onClick={handleToday}>
            ● Today
          </button>
          {canManageSchedule && (
            <>
              <button
                className="btn btn-sec"
                onClick={() => {
                  setManTeamId(selectedTeamIdFilter !== 'all' ? selectedTeamIdFilter : db.teams[0]?.id || '');
                  setManDate(selDay);
                  setManTitle('');
                  setManAddress('');
                  setManPhone('');
                  setManNotes('');
                  setIsManualModalOpen(true);
                }}
              >
                ＋ Manual Add Schedule
              </button>
            </>
          )}
          {['System Administrator', 'Call Center Operator'].includes(session.role) && (
            <button className="btn btn-pri" onClick={() => onOpenApptModal(null, { dt: selDay + 'T10:00' })}>
              ＋ Book Shoot
            </button>
          )}
        </div>
      </div>

      {/* Field Agent Team Notice Banner */}
      {isFieldAgent && userTeam && (
        <div
          className="rise"
          style={{
            background: 'linear-gradient(135deg, rgba(46,70,50,0.08), rgba(184,134,11,0.08))',
            border: `1.5px solid ${userTeam.color}`,
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="team-dot" style={{ background: userTeam.color, width: '12px', height: '12px' }} />
            <div>
              <b style={{ color: userTeam.color, fontSize: '15px' }}>{userTeam.name} Dashboard</b>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Assigned Team Lead: <b>{userTeam.lead || 'Registered'}</b> · Members: {userTeam.members?.map(m => m.name).join(', ') || 'Team active'}
              </div>
            </div>
          </div>
          <span className="chip ch-gold" style={{ fontSize: '12px', fontWeight: 600 }}>
            🔒 Filtered to Your Team Only
          </span>
        </div>
      )}

      {/* Today's 15-Property Assigned Field Route Section */}
      <div className="card rise full" style={{ animationDelay: '.04s', marginBottom: '20px' }}>
        <div className="card-h">
          <h3>📌 Today's Booked Shoots — Field Route Schedule</h3>
          <div className="spacer" />
          <span className="mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Booked shoots only · created by the call operator
          </span>
        </div>
        <div className="card-b">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '16px' }}>
            {visibleRoutes.length > 0 ? (
              visibleRoutes.map(rt => (
                <div
                  key={rt.team.id}
                  style={{
                    background: 'var(--cream2)',
                    border: `2px solid ${rt.team.color}`,
                    borderRadius: '12px',
                    padding: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <b style={{ font: "700 16px 'Fraunces', serif", color: rt.team.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="team-dot" style={{ background: rt.team.color }} /> {rt.team.name}
                    </b>
                    <span className="chip ch-gold" style={{ fontSize: '11px' }}>
                      {rt.items.length} shoot{rt.items.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>
                    Active Members Today: <b>{rt.team.members?.length ? rt.team.members.map(m => m.name).join(', ') : rt.team.lead || 'Team Active'}</b>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                    {rt.items.length === 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '10px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px dashed var(--sageline)' }}>
                        No shoots booked for today. Use “＋ Book Shoot”.
                      </div>
                    )}
                    {rt.items.map((it, idx) => {
                      const isCompleted = it.status === 'Completed';
                      const isIncomplete = it.status === 'Incomplete';

                      return (
                        <div
                          key={it.id}
                          style={{
                            background: '#ffffff',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            border: isCompleted
                              ? '1.5px solid #2E4632'
                              : isIncomplete
                              ? '1.5px solid #B65C3E'
                              : '1px solid var(--sageline)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                            <b
                              style={{ color: 'var(--pine)', cursor: 'pointer', flex: 1 }}
                              onClick={() => setDetailItem({ item: it, team: rt.team })}
                            >
                              {idx + 1}. {it.title}
                            </b>
                            <span className="mono" style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 600, marginLeft: '8px' }}>
                              {it.time || '10:00 AM'}
                            </span>
                          </div>

                          {/* Interactive Address Line -> Redirects to Pinned Map */}
                          <div
                            style={{
                              color: '#0288D1',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginBottom: '6px',
                              fontWeight: 500
                            }}
                            onClick={() => handleAddressClick(it.lat, it.lng, it.address)}
                            title="Click to redirect to Field Map"
                          >
                            <span>📍 {it.address}</span>
                            <span style={{ fontSize: '10px', textDecoration: 'underline' }}>[Map ↗]</span>
                          </div>

                          {/* Item Details Summary */}
                          <div style={{ fontSize: '11.5px', color: 'var(--muted)', display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            {it.phone && <span>📞 {it.phone}</span>}
                            <span className={`chip ${isCompleted ? 'ch-green' : isIncomplete ? 'ch-red' : 'ch-gold'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                              {it.status || 'Scheduled'}
                            </span>
                          </div>

                          {/* Quick Action Buttons for Field Teams */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-sm btn-subtle"
                              onClick={() => setDetailItem({ item: it, team: rt.team })}
                              style={{ fontSize: '11px', padding: '3px 8px' }}
                            >
                              ℹ Details
                            </button>
                            <button
                              className="btn btn-sm btn-gold"
                              onClick={() => handleOpenStatusModal({ ...it, teamId: rt.team.id }, 'Completed', rt.team.id)}
                              style={{ fontSize: '11px', padding: '3px 8px' }}
                              disabled={isCompleted}
                            >
                              ✓ Complete
                            </button>
                            <button
                              className="btn btn-sm btn-subtle"
                              onClick={() => handleOpenStatusModal({ ...it, teamId: rt.team.id }, 'Incomplete', rt.team.id)}
                              style={{ fontSize: '11px', padding: '3px 8px', color: '#B65C3E' }}
                              disabled={isIncomplete}
                            >
                              ✕ Incomplete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty" style={{ gridColumn: '1 / -1' }}>
                <p>No daily routes found for selected filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Month Calendar and Day Selection Section */}
      <div className="sched-grid">
        <div className="card rise" style={{ animationDelay: '.06s' }}>
          <div className="cal-head">
            <button className="cal-nav" onClick={handlePrev}>
              ‹
            </button>
            <h3>{monthTitle}</h3>
            <button className="cal-nav" onClick={handleNext}>
              ›
            </button>
          </div>

          <div className="cal-dow">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="cal-grid">
            {Array.from({ length: 42 }).map((_, i) => {
              const d = new Date(y, m, i - startDow + 1);
              const ymd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
              const list = apptsOn(ymd);

              const isOutMonth = d.getMonth() !== m;
              const isTodayCell = ymd === todayYMD();
              const isSelected = ymd === selDay;

              const cls = [
                'cal-day',
                isOutMonth ? 'out' : '',
                isTodayCell ? 'today' : '',
                isSelected ? 'sel' : ''
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div key={i} className={cls} onClick={() => handleDayClick(ymd, d)}>
                  <span className="n">{d.getDate()}</span>
                  <div className="cal-dots">
                    {list.slice(0, 5).map(a => {
                      const t = teamById(a.teamId);
                      return <i key={a.id} style={{ background: t ? t.color : '#9AA392' }} title={a.address} />;
                    })}
                  </div>
                  {list.length > 0 && <span className="cal-ct">{list.length} shoot{list.length > 1 ? 's' : ''}</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card rise" style={{ animationDelay: '.12s' }}>
          <div className="card-h">
            <h3>{dayTitle}</h3>
            <div className="spacer" />
            <span className="count-pill">{dayList.length}</span>
          </div>
          <div className="card-b" style={{ maxHeight: '520px', overflowY: 'auto' }}>
            {dayList.length ? (
              dayList.map(a => {
                const t = teamById(a.teamId);
                const pr = a.propId ? propById(a.propId) : null;
                return (
                  <div key={a.id} className="mini-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="t">{fmtTime(a.dt)}</span>
                      <span className="dot" style={{ background: t ? t.color : '#9AA392' }} />
                      <div style={{ flex: 1 }}>
                        <b
                          className="day-prop"
                          style={{ cursor: 'pointer', color: '#0288D1' }}
                          onClick={() => handleAddressClick(a.lat, a.lng, a.address)}
                          title="Redirect to Field Map"
                        >
                          <Icon name="pin" size={11} /> {a.address} ↗
                        </b>
                        <div className="addrline">
                          {a.name} ({a.phone}) · <span className={`chip s-${a.status}`} style={{ border: 'none', padding: '1px 7px' }}>{a.status}</span>
                        </div>
                      </div>
                      {!isFieldAgent && (
                        <button className="icobtn" onClick={() => onOpenApptModal(a)} title="Edit">
                          <Icon name="edit" />
                        </button>
                      )}
                    </div>

                    {pr && (
                      <div style={{ fontSize: '11.5px', color: 'var(--gold)', fontWeight: 600, marginTop: '4px' }}>
                        🏠 Linked Property: {pr.name} ({pr.listing})
                      </div>
                    )}

                    {a.status === 'Incomplete' && a.incompletionReason && (
                      <div style={{ marginTop: '6px', fontSize: '12px', background: '#fdf2f0', color: '#B65C3E', padding: '6px 8px', borderRadius: '6px' }}>
                        <b>Incompletion Reason:</b> {a.incompletionReason}
                      </div>
                    )}

                    {/* Field Agent Status Reporting Controls */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        className="btn btn-sm btn-gold"
                        onClick={() => handleOpenStatusModal(a, 'Completed')}
                        title="Mark as Completed"
                      >
                        ✓ Mark Completed
                      </button>
                      <button
                        className="btn btn-sm btn-subtle"
                        onClick={() => handleOpenStatusModal(a, 'Incomplete')}
                        title="Mark as Incomplete"
                      >
                        ✕ Mark Incomplete
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty">
                <Icon name="cal" size={40} />
                <p>Nothing scheduled this day.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Visit Information Modal */}
      {detailItem && (
        <Modal
          isOpen={true}
          title={`Visit Details — ${detailItem.item.title}`}
          onClose={() => setDetailItem(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setDetailItem(null)}>
                Close
              </button>
              <button
                className="btn btn-sec"
                onClick={() => {
                  handleAddressClick(detailItem.item.lat, detailItem.item.lng, detailItem.item.address);
                  setDetailItem(null);
                }}
              >
                🗺️ View on Field Map
              </button>
              <button
                className="btn btn-gold"
                onClick={() => handleOpenStatusModal({ ...detailItem.item, teamId: detailItem.team.id }, 'Completed', detailItem.team.id)}
              >
                ✓ Mark Completed
              </button>
              <button
                className="btn btn-subtle"
                onClick={() => handleOpenStatusModal({ ...detailItem.item, teamId: detailItem.team.id }, 'Incomplete', detailItem.team.id)}
                style={{ color: '#B65C3E' }}
              >
                ✕ Mark Incomplete
              </button>
            </>
          }
        >
          <div className="fgrid">
            <div className="fld full">
              <label>Assigned Team</label>
              <div style={{ fontSize: '14px', fontWeight: 600, color: detailItem.team.color }}>
                {detailItem.team.name} ({detailItem.team.members?.length || 0} Members Assigned)
              </div>
            </div>

            <div className="fld">
              <label>Scheduled Visit Time</label>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{detailItem.item.time || '10:00 AM'}</div>
            </div>

            <div className="fld">
              <label>Current Status</label>
              <span className={`chip ${detailItem.item.status === 'Completed' ? 'ch-green' : detailItem.item.status === 'Incomplete' ? 'ch-red' : 'ch-gold'}`}>
                {detailItem.item.status || 'Scheduled'}
              </span>
            </div>

            <div className="fld full">
              <label>Contact Person & Phone</label>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>
                👤 {detailItem.item.contactName || detailItem.item.title}
                {detailItem.item.phone && (
                  <span style={{ marginLeft: '12px' }}>
                    <a href={`tel:${detailItem.item.phone}`} style={{ color: '#0288D1', textDecoration: 'none' }}>
                      📞 {detailItem.item.phone}
                    </a>
                  </span>
                )}
              </div>
            </div>

            <div className="fld full">
              <label>Address & Location (Click to redirect to Map)</label>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#0288D1',
                  cursor: 'pointer',
                  background: 'var(--cream2)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--sageline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onClick={() => {
                  handleAddressClick(detailItem.item.lat, detailItem.item.lng, detailItem.item.address);
                  setDetailItem(null);
                }}
              >
                <span>📍 {detailItem.item.address}</span>
                <span className="btn btn-sm btn-subtle">Redirect to Pinned Map ↗</span>
              </div>

              {detailItem.item.lat && detailItem.item.lng && (
                <div style={{ marginTop: '6px', fontSize: '11.5px' }}>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${detailItem.item.lat},${detailItem.item.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--gold)', textDecoration: 'underline' }}
                  >
                    ↗ Open Turn-by-Turn in Google Maps Navigation
                  </a>
                </div>
              )}
            </div>

            <div className="fld full">
              <label>Visit Notes & Instructions</label>
              <div style={{ fontSize: '12.5px', background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid var(--sageline)' }}>
                {detailItem.item.notes || 'Photo shoot, property intake, and owner verification.'}
              </div>
            </div>

            {detailItem.item.incompletionReason && (
              <div className="fld full" style={{ background: '#fdf2f0', padding: '10px', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
                <label style={{ color: '#B65C3E' }}>Incompletion Reason Logged</label>
                <div style={{ fontSize: '12.5px', color: '#B65C3E', fontWeight: 600 }}>
                  {detailItem.item.incompletionReason}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Field Execution Status Modal */}
      <Modal
        isOpen={statusModalOpen}
        title={targetStatus === 'Completed' ? 'Log Completed Shoot' : 'Report Incomplete Shoot'}
        onClose={() => setStatusModalOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </button>
            <button className={`btn ${targetStatus === 'Completed' ? 'btn-pri' : 'btn-danger'}`} onClick={handleSaveStatusUpdate}>
              Submit Status Report
            </button>
          </>
        }
      >
        {activeAppt && (
          <div className="fgrid">
            <div className="fld full">
              <label>Location / Appointment</label>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{activeAppt.name} — {activeAppt.address}</div>
            </div>

            {targetStatus === 'Completed' ? (
              <div className="fld full">
                <label>Team Members Executing Route</label>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>
                  Select field agents who completed this shoot:
                </div>
                {teamById(activeAppt.teamId)?.members?.map(m => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(m.name)}
                      onChange={e => {
                        if (e.target.checked) setSelectedMembers(prev => [...prev, m.name]);
                        else setSelectedMembers(prev => prev.filter(x => x !== m.name));
                      }}
                    />
                    <span>{m.name} ({m.phone})</span>
                  </label>
                )) || <div>Lead: {session.name}</div>}
              </div>
            ) : (
              <div className="fld full">
                <label style={{ color: '#B65C3E' }}>Mandatory Reason for Incompletion *</label>
                <textarea
                  className="inp"
                  value={incompletionReason}
                  onChange={e => setIncompletionReason(e.target.value)}
                  placeholder="e.g. Owner rescheduled shoot, property locked, rain delay..."
                  rows={4}
                  required
                />
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  ⚠ Submitting will automatically route this appointment back to the Call Center Operator's Follow-Up queue and notify the desk.
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Manual Add Schedule Modal for Manager / Admin */}
      <Modal
        isOpen={isManualModalOpen}
        title="＋ Manual Add Schedule Visit"
        onClose={() => setIsManualModalOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsManualModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-pri" onClick={handleSaveManualSchedule}>
              Assign Schedule Entry
            </button>
          </>
        }
      >
        <div className="fgrid">
          <div className="fld">
            <label>Assigned Field Team *</label>
            <select
              className="inp"
              value={manTeamId}
              onChange={e => setManTeamId(e.target.value)}
            >
              {db.teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.lead || 'Team Lead'})
                </option>
              ))}
            </select>
          </div>

          <div className="fld">
            <label>Schedule Date *</label>
            <input
              type="date"
              className="inp"
              value={manDate}
              onChange={e => setManDate(e.target.value)}
            />
          </div>

          <div className="fld full">
            <label>Property / Visit Title *</label>
            <input
              type="text"
              className="inp"
              placeholder="e.g. Bole Atlas Apartment 4B Shoot"
              value={manTitle}
              onChange={e => setManTitle(e.target.value)}
              required
            />
          </div>

          <div className="fld full">
            <label>Street Address / Location *</label>
            <input
              type="text"
              className="inp"
              placeholder="e.g. Bole Road, near Atlas Hotel"
              value={manAddress}
              onChange={e => setManAddress(e.target.value)}
              required
            />
          </div>

          <div className="fld">
            <label>Contact Phone Number</label>
            <input
              type="tel"
              className="inp"
              placeholder="+251 9..."
              value={manPhone}
              onChange={e => setManPhone(e.target.value)}
            />
          </div>

          <div className="fld">
            <label>Assigned Time Slot</label>
            <select
              className="inp"
              value={manTime}
              onChange={e => setManTime(e.target.value)}
            >
              {['08:30 AM', '09:00 AM', '10:00 AM', '11:00 AM', '01:30 PM', '02:30 PM', '04:00 PM'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="fld full">
            <label>Instructions & Notes for Team</label>
            <textarea
              className="inp"
              rows={3}
              placeholder="Special shoot preferences, key contact details..."
              value={manNotes}
              onChange={e => setManNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </section>
  );
}
