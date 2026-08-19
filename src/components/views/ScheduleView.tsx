'use client';

import React, { useState } from 'react';
import { Appointment, DatabaseSchema, Session } from '@/types';
import { dOff, fmtTime, localYMD, pad, todayYMD, uid } from '@/lib/utils';
import { Icon } from '@/lib/icons';
import { Modal } from '@/components/ui/Modal';

interface ScheduleViewProps {
  db: DatabaseSchema;
  session: Session;
  onOpenApptModal: (appt?: Appointment | null, prefill?: Partial<Appointment>) => void;
  onUpdateDatabase: (updater: (draft: DatabaseSchema) => void) => void;
  onToast: (msg: string, isErr?: boolean) => void;
}

export function ScheduleView({ db, session, onOpenApptModal, onUpdateDatabase, onToast }: ScheduleViewProps) {
  const [calCur, setCalCur] = useState<Date>(() => new Date());
  const [selDay, setSelDay] = useState<string>(() => todayYMD());

  // Field Agent Completion / Incompletion Modal state
  const [activeAppt, setActiveAppt] = useState<Appointment | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'Completed' | 'Incomplete'>('Completed');
  const [incompletionReason, setIncompletionReason] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const isFieldAgent = session.role === 'Team Member (Field Agent)';

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

  const handleOpenStatusModal = (appt: Appointment, status: 'Completed' | 'Incomplete') => {
    setActiveAppt(appt);
    setTargetStatus(status);
    setIncompletionReason('');
    const team = teamById(appt.teamId);
    setSelectedMembers(team?.members?.map(m => m.name) || []);
    setStatusModalOpen(true);
  };

  const handleSaveStatusUpdate = () => {
    if (!activeAppt) return;

    if (targetStatus === 'Incomplete' && !incompletionReason.trim()) {
      return onToast('Mandatory reason for incompletion is required.', true);
    }

    onUpdateDatabase(draft => {
      const appt = draft.appointments.find(a => a.id === activeAppt.id);
      if (appt) {
        appt.status = targetStatus;
        if (targetStatus === 'Incomplete') {
          appt.incompletionReason = incompletionReason.trim();

          // AUTOMATIC WORKFLOW: Route incomplete appointment back to Call Center Operator Follow-Up queue
          draft.followups.unshift({
            id: uid(),
            doc: todayYMD(),
            name: appt.name,
            phone: appt.phone,
            property: appt.address,
            status: 'Waiting for manager approval',
            next: dOff(1),
            action: `[INCOMPLETE REASON]: ${incompletionReason.trim()} (Field Team: ${session.name})`,
            priority: 'High'
          });

          // Operator Notification Alert
          if (!draft.notifications) draft.notifications = [];
          draft.notifications.unshift({
            id: uid(),
            ts: Date.now(),
            title: `⚠ Incomplete Appointment: ${appt.name}`,
            message: `Field team marked appointment as Incomplete. Reason: "${incompletionReason.trim()}". Routed to Follow-Up queue.`,
            type: 'incomplete',
            read: false
          });

          draft.activity.unshift({
            ts: Date.now(),
            text: `Field Team marked ${appt.name}'s shoot as INCOMPLETE. Reason: ${incompletionReason.trim()}`
          });
        } else {
          appt.completedByMembers = selectedMembers;

          // AUTOMATIC WORKFLOW: Archive completed shoot in Clients / Closed section
          draft.followups.unshift({
            id: uid(),
            doc: todayYMD(),
            name: appt.name,
            phone: appt.phone,
            property: appt.address,
            status: 'Closed - Won',
            next: todayYMD(),
            action: `[COMPLETED SHOOT ARCHIVED]: Successfully photographed by ${selectedMembers.join(', ') || session.name}`,
            priority: 'Normal'
          });

          if (!draft.notifications) draft.notifications = [];
          draft.notifications.unshift({
            id: uid(),
            ts: Date.now(),
            title: `✓ Appointment Completed: ${appt.name}`,
            message: `Completed by ${selectedMembers.join(', ') || session.name}. Moved to Clients section.`,
            type: 'completed',
            read: false
          });

          draft.activity.unshift({
            ts: Date.now(),
            text: `Field Team completed ${appt.name}'s shoot at ${appt.address}. Archived in Clients.`
          });
        }
      }
    });

    setStatusModalOpen(false);
    onToast(targetStatus === 'Completed' ? 'Shoot marked Completed ✓' : 'Incompletion logged & routed to Operator Follow-Ups ⚠');
  };

  return (
    <section className="view on" id="view-schedule">
      <div className="pagehead rise">
        <div>
          <div className="ph-title">Daily Field Route & Shoot Schedule</div>
          <div className="ph-sub">
            {isFieldAgent ? 'Field Agent View — Report Completed/Incomplete shoots' : 'Month calendar — click any day to see scheduled shoots'}
          </div>
        </div>
        <div className="ph-actions">
          <span className="chiprow">
            {db.teams.map(t => (
              <span key={t.id} className="fchip" style={{ cursor: 'default' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: t.color,
                    marginRight: '6px'
                  }}
                />
                {t.name}
              </span>
            ))}
          </span>
          <button className="btn btn-sec" onClick={handleToday}>
            ● Today
          </button>
          {!isFieldAgent && (
            <button className="btn btn-pri" onClick={() => onOpenApptModal(null, { dt: selDay + 'T10:00' })}>
              ＋ Book on selected day
            </button>
          )}
        </div>
      </div>

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
                        <b className="day-prop">
                          <Icon name="pin" size={11} /> {a.address}
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
    </section>
  );
}
