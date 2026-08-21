'use client';

import React, { useState } from 'react';
import { Appointment, AppointmentStatus, DatabaseSchema } from '@/types';
import { balanceTeamWorkload, exportCSV, exportToWordDoc, findNearbyAppointments, fmtDate, fmtTime, isToday, todayYMD, uid } from '@/lib/utils';
import { Icon } from '@/lib/icons';
import { Modal } from '@/components/ui/Modal';
import { MapPinPicker } from '@/components/ui/MapPinPicker';

interface AppointmentsViewProps {
  db: DatabaseSchema;
  searchQuery: string;
  onUpdateDatabase: (updater: (draft: DatabaseSchema) => void) => void;
  onToast: (msg: string, isErr?: boolean) => void;
  onAskConfirm: (msg: string, onConfirm: () => void) => void;
  editingAppt: Appointment | null;
  isModalOpen: boolean;
  onOpenModal: (appt?: Appointment | null) => void;
  onCloseModal: () => void;
  prefillData?: Partial<Appointment> | null;
}

export function AppointmentsView({
  db,
  searchQuery,
  onUpdateDatabase,
  onToast,
  onAskConfirm,
  editingAppt,
  isModalOpen,
  onOpenModal,
  onCloseModal,
  prefillData
}: AppointmentsViewProps) {
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'Completed' | 'Incomplete' | 'Cancelled'>('all');

  // Form State
  const [kind, setKind] = useState<'broker' | 'owner'>(editingAppt?.kind || prefillData?.kind || 'broker');
  const [contactId, setContactId] = useState(editingAppt?.contactId || '');
  const [name, setName] = useState(editingAppt?.name || prefillData?.name || '');
  const [phone, setPhone] = useState(editingAppt?.phone || prefillData?.phone || '');
  const [propId, setPropId] = useState(editingAppt?.propId || prefillData?.propId || '');
  const [isShoot, setIsShoot] = useState<boolean>(editingAppt?.isShoot ?? prefillData?.isShoot ?? true);
  const [dt, setDt] = useState<string>(() => {
    if (editingAppt?.dt) {
      const d = new Date(editingAppt.dt);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    if (prefillData?.dt) return prefillData.dt.slice(0, 16);
    const d = new Date(Date.now() + 3600e3);
    d.setMinutes(0, 0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [status, setStatus] = useState<AppointmentStatus>(editingAppt?.status || 'Scheduled');
  const [address, setAddress] = useState(editingAppt?.address || prefillData?.address || '');
  const [teamId, setTeamId] = useState(editingAppt?.teamId || '');
  const [notes, setNotes] = useState(editingAppt?.notes || '');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    editingAppt?.lat != null && editingAppt?.lng != null ? { lat: editingAppt.lat, lng: editingAppt.lng } : null
  );

  const teamById = (id: string) => db.teams.find(t => t.id === id);

  // OPERATOR WORKFLOW: Filter to APPROVED brokers and properties only
  const approvedBrokers = db.brokers.filter(b => b.active && (b.approvalStatus || 'Approved') === 'Approved');
  const approvedProperties = db.properties.filter(p => (p.approvalStatus || 'Approved') === 'Approved');

  // Filter list
  let list = [...db.appointments];
  const now = new Date();
  if (filter === 'today') list = list.filter(a => isToday(a.dt));
  else if (filter === 'upcoming') list = list.filter(a => new Date(a.dt) >= now);
  else if (filter === 'Completed' || filter === 'Incomplete' || filter === 'Cancelled') list = list.filter(a => a.status === filter);

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(
      a =>
        a.name.toLowerCase().includes(q) ||
        a.address.toLowerCase().includes(q) ||
        a.notes.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => {
    const ta = new Date(a.dt) >= new Date(todayYMD() + 'T00:00');
    const tb = new Date(b.dt) >= new Date(todayYMD() + 'T00:00');
    if (ta !== tb) return Number(tb) - Number(ta);
    return ta ? new Date(a.dt).getTime() - new Date(b.dt).getTime() : new Date(b.dt).getTime() - new Date(a.dt).getTime();
  });

  const handleStatusChange = (id: string, newStatus: AppointmentStatus) => {
    onUpdateDatabase(draft => {
      const appt = draft.appointments.find(a => a.id === id);
      if (appt) {
        appt.status = newStatus;
        draft.activity.unshift({
          ts: Date.now(),
          text: `Status changed: ${appt.name}'s shoot → ${newStatus}.`
        });
        draft.activity = draft.activity.slice(0, 40);
      }
    });
    onToast(`Marked ${newStatus}`);
  };

  const handleAutoBalanceWorkload = () => {
    if (db.teams.length === 0) {
      return onToast('No active teams available for balancing.', true);
    }
    onAskConfirm('Auto-balance and evenly distribute unassigned bookings among active daily teams?', () => {
      onUpdateDatabase(draft => {
        draft.appointments = balanceTeamWorkload(draft.appointments, draft.teams);
        draft.activity.unshift({
          ts: Date.now(),
          text: `Automated workload balancing executed across ${draft.teams.length} teams.`
        });
      });
      onToast('Workload balanced evenly across active teams ✓');
    });
  };

  const handleDelete = (id: string) => {
    onAskConfirm('Delete this appointment?', () => {
      onUpdateDatabase(draft => {
        draft.appointments = draft.appointments.filter(a => a.id !== id);
      });
      onToast('Deleted');
    });
  };

  const handleSave = () => {
    if (!name.trim() || !address.trim() || !dt) {
      return onToast('Contact name, address and date are required.', true);
    }

    onUpdateDatabase(draft => {
      const selectedTeam = draft.teams.find(t => t.id === teamId);
      const rec: Appointment = {
        id: editingAppt ? editingAppt.id : uid(),
        dt: new Date(dt).toISOString(),
        kind,
        contactId,
        name: name.trim(),
        phone: phone.trim(),
        propId,
        address: address.trim(),
        teamId,
        status,
        notes: notes.trim(),
        lat: pin ? pin.lat : null,
        lng: pin ? pin.lng : null,
        isShoot,
        assignedMembersSnapshot: selectedTeam?.members || []
      };

      if (editingAppt) {
        const idx = draft.appointments.findIndex(a => a.id === editingAppt.id);
        if (idx !== -1) draft.appointments[idx] = rec;
        draft.activity.unshift({ ts: Date.now(), text: `Appointment updated: ${rec.name} — ${rec.address}.` });
      } else {
        draft.appointments.push(rec);
        draft.activity.unshift({ ts: Date.now(), text: `New ${isShoot ? 'Shoot' : ''} appointment booked: ${rec.name} — ${rec.address}.` });
      }
      draft.activity = draft.activity.slice(0, 40);
    });

    onCloseModal();
    onToast(editingAppt ? 'Appointment updated ✓' : 'Appointment booked ✓' + (pin ? ' (pinned)' : ''));
  };

  const handleKindChange = (newKind: 'broker' | 'owner') => {
    setKind(newKind);
    setContactId('');
  };

  const handleSourceChange = (cId: string) => {
    setContactId(cId);
    if (!cId) return;
    const pool = kind === 'broker' ? approvedBrokers : db.owners;
    const found = pool.find(x => x.id === cId);
    if (found) {
      setName(found.name);
      setPhone(found.phone);
    }
  };

  const handlePropertyChange = (pId: string) => {
    setPropId(pId);
    const p = approvedProperties.find(x => x.id === pId);
    if (p) {
      setAddress(p.address);
      if (p.lat != null && p.lng != null) {
        setPin({ lat: p.lat, lng: p.lng });
      }
    }
  };

  const handleExportWord = () => {
    const cols = ['Date & Time', 'Type', 'Contact Name', 'Phone', 'Address', 'Assigned Team', 'Status', 'Incompletion Reason / Notes'];
    const rows = db.appointments.map(a => {
      const t = teamById(a.teamId);
      return [
        fmtDate(a.dt) + ' ' + fmtTime(a.dt),
        a.isShoot ? 'Shoot Appointment' : a.kind.toUpperCase(),
        a.name,
        a.phone,
        a.address,
        t ? t.name : 'Unassigned',
        a.status,
        a.incompletionReason ? `INCOMPLETE REASON: ${a.incompletionReason}` : a.notes || '—'
      ];
    });
    exportToWordDoc('Das Homes Appointments & Shoot Schedule Report', cols, rows, 'dashomes-appointments-report');
  };

  const handleFillDemo = () => {
    setKind('broker');
    setName('Wondwossen Tadesse');
    setPhone('+251 91 888 4455');
    setAddress('Bole Atlas, Near Friendship Hotel, Addis Ababa');
    setNotes('Photo shoot for 3-bedroom luxury apartment + video walkthrough');
    if (db.teams.length > 0) setTeamId(db.teams[0].id);
    setPin({ lat: 9.0062, lng: 38.7845 });
    onToast('Filled appointment form with demo data ✓');
  };

  return (
    <section className="view on" id="view-appointments">
      <div className="pagehead rise">
        <div>
          <div className="ph-title">Photo Shoot Appointments</div>
          <div className="ph-sub">Call Center Operator Desk — Shoot appointments with approved brokers & owners</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-sec" onClick={handleAutoBalanceWorkload} title="Balance workload evenly across active teams">
            ⚖ Auto-Balance Teams
          </button>
          <button className="btn btn-ghost" onClick={handleExportWord} title="Export Word Document">
            📄 Export Word
          </button>
          <button className="btn btn-ghost" onClick={() => exportCSV('appointments', db)}>
            ⇩ Export CSV
          </button>
          <button className="btn btn-pri" onClick={() => onOpenModal(null)}>
            ＋ Book Appointment
          </button>
        </div>
      </div>

      <div className="chiprow rise" style={{ animationDelay: '.06s', marginBottom: '16px' }}>
        {[
          ['all', 'All'],
          ['today', 'Today'],
          ['upcoming', 'Upcoming'],
          ['Completed', 'Completed'],
          ['Incomplete', 'Incomplete'],
          ['Cancelled', 'Cancelled']
        ].map(([k, l]) => (
          <button
            key={k}
            className={`fchip ${filter === k ? 'on' : ''}`}
            onClick={() => setFilter(k as any)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="card rise" style={{ animationDelay: '.1s' }}>
        <div className="tblwrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type & Contact</th>
                <th>Property Address / Route Cluster</th>
                <th>Team / Registered Members</th>
                <th>Status</th>
                <th>Notes / Incompletion Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length ? (
                list.map(a => {
                  const t = teamById(a.teamId);
                  const nearby = findNearbyAppointments(a, db.appointments);
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="dt-cell">
                          <strong>
                            {fmtDate(a.dt)}
                            {isToday(a.dt) ? ' · today' : ''}
                          </strong>
                          <span>{fmtTime(a.dt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="who">
                          <span className={`src-chip ${a.isShoot ? 'ch-gold' : a.kind === 'broker' ? 'src-broker' : 'src-owner'}`}>
                            {a.isShoot ? '📸 Shoot' : a.kind}
                          </span>
                          <b>{a.name}</b>
                          <span className="mono">{a.phone || '—'}</span>
                        </div>
                      </td>
                      <td className="addr">
                        <div>
                          {a.lat != null ? <span title="pinned" style={{ color: 'var(--gold)' }}>◉ </span> : null}
                          {a.address}
                        </div>
                        {nearby.length > 0 && (
                          <div style={{ marginTop: '4px' }}>
                            <span className="chip ch-blue" style={{ fontSize: '10px', padding: '2px 6px' }}>
                              📍 {nearby.length} nearby appointment(s) (~15m radius cluster)
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        {t ? (
                          <>
                            <span className="team-dot" style={{ background: t.color }} />
                            <b>{t.name}</b>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                              {t.members?.length ? t.members.map(m => m.name).join(', ') : t.lead}
                            </div>
                          </>
                        ) : (
                          <span className="chip ch-gray">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <select
                          className={`stat-sel s-${a.status}`}
                          value={a.status}
                          onChange={e => handleStatusChange(a.id, e.target.value as AppointmentStatus)}
                        >
                          {['Scheduled', 'Confirmed', 'Completed', 'Incomplete', 'Cancelled'].map(s => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="notes">
                        {a.status === 'Incomplete' && a.incompletionReason ? (
                          <div style={{ color: '#B65C3E', fontWeight: 600 }}>⚠ {a.incompletionReason}</div>
                        ) : (
                          a.notes || '—'
                        )}
                      </td>
                      <td>
                        <div className="rowact">
                          <button className="icobtn" onClick={() => onOpenModal(a)} title="Edit">
                            <Icon name="edit" />
                          </button>
                          <button className="icobtn danger" onClick={() => handleDelete(a.id)} title="Delete">
                            <Icon name="trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <Icon name="cam" size={40} />
                      <p>No appointments match this filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingAppt ? 'Edit Appointment' : 'Book Photo-Shoot Appointment'}
        onClose={onCloseModal}
        wide
        footer={
          <>
            {!editingAppt && (
              <button className="btn btn-gold" type="button" onClick={handleFillDemo} style={{ marginRight: 'auto' }}>
                ⚡ Auto-Fill Demo Data
              </button>
            )}
            <button className="btn btn-ghost" onClick={onCloseModal}>
              Cancel
            </button>
            <button className="btn btn-pri" onClick={handleSave}>
              Save Appointment
            </button>
          </>
        }
      >
        <div className="fgrid">
          <div className="fld full">
            <label>Appointment Type</label>
            <div className="pillgrp">
              <label>
                <input type="checkbox" checked={isShoot} onChange={e => setIsShoot(e.target.checked)} />
                <span>📸 Broker Shoot Appointment (Multiple rapid listings)</span>
              </label>
            </div>
          </div>

          <div className="fld full">
            <label>Contact Role</label>
            <div className="pillgrp">
              <label>
                <input type="radio" name="akind" value="broker" checked={kind === 'broker'} onChange={() => handleKindChange('broker')} />
                <span>☎ Approved Broker</span>
              </label>
              <label>
                <input type="radio" name="akind" value="owner" checked={kind === 'owner'} onChange={() => handleKindChange('owner')} />
                <span>🏢 Building Owner</span>
              </label>
            </div>
          </div>

          <div className="fld">
            <label>Select Approved Contact *</label>
            <select className="inp" value={contactId} onChange={e => handleSourceChange(e.target.value)}>
              <option value="">— type name manually —</option>
              {(kind === 'broker' ? approvedBrokers : db.owners).map(x => (
                <option key={x.id} value={x.id}>
                  {x.name} · {x.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="fld">
            <label>Phone *</label>
            <input className="inp mono" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+251 9…" />
          </div>

          {!contactId && (
            <div className="fld full">
              <label>Contact Name *</label>
              <input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
            </div>
          )}

          <div className="fld full">
            <label>Link to Approved Property (Optional)</label>
            <select className="inp" value={propId} onChange={e => handlePropertyChange(e.target.value)}>
              <option value="">— none —</option>
              {approvedProperties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.address}
                </option>
              ))}
            </select>
          </div>

          <div className="fld">
            <label>Date & Time *</label>
            <input className="inp" type="datetime-local" value={dt} onChange={e => setDt(e.target.value)} required />
          </div>

          <div className="fld">
            <label>Status</label>
            <select className="inp" value={status} onChange={e => setStatus(e.target.value as AppointmentStatus)}>
              {['Scheduled', 'Confirmed', 'Completed', 'Incomplete', 'Cancelled'].map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="fld full">
            <label>Property Address / Google Maps Location *</label>
            <input className="inp" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Bole Near Olympia, Apartment 4B" />
          </div>

          <div className="fld full">
            <label>Pin Location on Map (for Route Optimization & Proximity Clustering)</label>
            <MapPinPicker initialPin={pin} onPinChange={newPin => setPin(newPin)} />
          </div>

          <div className="fld full">
            <label>Assign Daily Team</label>
            <select className="inp" value={teamId} onChange={e => setTeamId(e.target.value)}>
              <option value="">— Unassigned (Auto-Balance later) —</option>
              {db.teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.members?.length ? `${t.members.length} members` : t.lead})
                </option>
              ))}
            </select>
          </div>

          <div className="fld full">
            <label>Additional Notes / Shoot Instructions</label>
            <textarea className="inp" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Key instructions, shoot duration..." />
          </div>
        </div>
      </Modal>
    </section>
  );
}
