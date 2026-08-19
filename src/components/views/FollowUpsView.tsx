'use client';

import React, { useState } from 'react';
import { DatabaseSchema, FollowUp, FollowUpStatus, Owner } from '@/types';
import { daysUntil, dOff, exportCSV, fmtD, uid } from '@/lib/utils';
import { Icon } from '@/lib/icons';
import { Modal } from '@/components/ui/Modal';

interface FollowUpsViewProps {
  db: DatabaseSchema;
  searchQuery: string;
  onUpdateDatabase: (updater: (draft: DatabaseSchema) => void) => void;
  onToast: (msg: string, isErr?: boolean) => void;
  onAskConfirm: (msg: string, onConfirm: () => void) => void;
  onBookShootForOwner: (owner: { name: string; phone: string; address?: string }) => void;
}

export const FU_STATUSES: FollowUpStatus[] = [
  'New lead',
  'Contacted',
  'Waiting for manager approval',
  'Negotiating',
  'Documents pending',
  'Meeting scheduled',
  'Closed - Won',
  'Lost'
];

export const fuColorClass = (s: FollowUpStatus): string =>
  ({
    'New lead': 'ch-gold',
    Contacted: 'ch-sage',
    'Waiting for manager approval': 'ch-blue',
    Negotiating: 'ch-gold',
    'Documents pending': 'ch-blue',
    'Meeting scheduled': 'ch-sage',
    'Closed - Won': 'ch-green',
    Lost: 'ch-clay'
  }[s] || 'ch-gray');

export function FollowUpsView({
  db,
  searchQuery,
  onUpdateDatabase,
  onToast,
  onAskConfirm,
  onBookShootForOwner
}: FollowUpsViewProps) {
  const [activeTab, setActiveTab] = useState<'tracker' | 'owners'>('tracker');

  // FollowUp Modal State
  const [editingFU, setEditingFU] = useState<FollowUp | null>(null);
  const [isFUModalOpen, setIsFUModalOpen] = useState(false);
  const [fDoc, setFDoc] = useState(dOff(0));
  const [fOwnerSrc, setFOwnerSrc] = useState('');
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fProp, setFProp] = useState('');
  const [fStatus, setFStatus] = useState<FollowUpStatus>('New lead');
  const [fNext, setFNext] = useState(dOff(3));
  const [fAction, setFAction] = useState('');

  // Owner Modal State
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [oName, setOName] = useState('');
  const [oPhone, setOPhone] = useState('');
  const [oNotes, setONotes] = useState('');

  let followups = [...db.followups].sort((a, b) => (a.next || '9999').localeCompare(b.next || '9999'));
  let owners = db.owners;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    followups = followups.filter(
      f =>
        f.name.toLowerCase().includes(q) ||
        f.property.toLowerCase().includes(q) ||
        f.action.toLowerCase().includes(q) ||
        f.status.toLowerCase().includes(q)
    );
    owners = owners.filter(
      o => o.name.toLowerCase().includes(q) || o.phone.toLowerCase().includes(q) || o.notes.toLowerCase().includes(q)
    );
  }

  const handleOpenFUModal = (f?: FollowUp | null) => {
    if (f) {
      setEditingFU(f);
      setFDoc(f.doc || dOff(0));
      setFOwnerSrc('');
      setFName(f.name);
      setFPhone(f.phone || '');
      setFProp(f.property);
      setFStatus(f.status);
      setFNext(f.next || dOff(3));
      setFAction(f.action || '');
    } else {
      setEditingFU(null);
      setFDoc(dOff(0));
      setFOwnerSrc('');
      setFName('');
      setFPhone('');
      setFProp('');
      setFStatus('New lead');
      setFNext(dOff(3));
      setFAction('');
    }
    setIsFUModalOpen(true);
  };

  const handleOwnerSrcChange = (id: string) => {
    setFOwnerSrc(id);
    const o = db.owners.find(x => x.id === id);
    if (o) {
      setFName(o.name);
      setFPhone(o.phone);
    }
  };

  const handleSaveFU = () => {
    if (!fName.trim() || !fProp.trim()) {
      return onToast('Contact name and property are required.', true);
    }

    onUpdateDatabase(draft => {
      const rec: FollowUp = {
        id: editingFU ? editingFU.id : uid(),
        doc: fDoc,
        name: fName.trim(),
        phone: fPhone.trim(),
        property: fProp.trim(),
        status: fStatus,
        next: fNext,
        action: fAction.trim()
      };

      if (editingFU) {
        const idx = draft.followups.findIndex(f => f.id === editingFU.id);
        if (idx !== -1) draft.followups[idx] = rec;
      } else {
        draft.followups.push(rec);
        draft.activity.unshift({
          ts: Date.now(),
          text: `Follow-up logged: ${rec.name} — ${rec.property} (${rec.status}).`
        });
      }
      draft.activity = draft.activity.slice(0, 40);
    });

    setIsFUModalOpen(false);
    onToast('Saved ✓');
  };

  const handleDeleteFU = (id: string) => {
    onAskConfirm('Delete this follow-up?', () => {
      onUpdateDatabase(draft => {
        draft.followups = draft.followups.filter(f => f.id !== id);
      });
      onToast('Deleted');
    });
  };

  const handleOpenOwnerModal = (o?: Owner | null) => {
    if (o) {
      setEditingOwner(o);
      setOName(o.name);
      setOPhone(o.phone);
      setONotes(o.notes || '');
    } else {
      setEditingOwner(null);
      setOName('');
      setOPhone('');
      setONotes('');
    }
    setIsOwnerModalOpen(true);
  };

  const handleSaveOwner = () => {
    if (!oName.trim() || !oPhone.trim()) {
      return onToast('Name and phone are required.', true);
    }

    onUpdateDatabase(draft => {
      const rec: Owner = {
        id: editingOwner ? editingOwner.id : uid(),
        name: oName.trim(),
        phone: oPhone.trim(),
        notes: oNotes.trim()
      };

      if (editingOwner) {
        const idx = draft.owners.findIndex(o => o.id === editingOwner.id);
        if (idx !== -1) draft.owners[idx] = rec;
      } else {
        draft.owners.push(rec);
        draft.activity.unshift({ ts: Date.now(), text: `Owner registered: ${rec.name}.` });
      }
      draft.activity = draft.activity.slice(0, 40);
    });

    setIsOwnerModalOpen(false);
    onToast('Saved ✓');
  };

  const handleDeleteOwner = (id: string) => {
    onAskConfirm('Delete this owner?', () => {
      onUpdateDatabase(draft => {
        draft.owners = draft.owners.filter(o => o.id !== id);
      });
      onToast('Deleted');
    });
  };

  return (
    <section className="view on" id="view-followups">
      <div className="pagehead rise">
        <div>
          <div className="ph-title">Building Owner Follow-Ups</div>
          <div className="ph-sub">Status, outcomes and next steps — no lead gets lost</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-ghost" onClick={() => exportCSV('followups', db)}>
            ⇩ Export CSV
          </button>
          <button className="btn btn-sec" onClick={() => handleOpenOwnerModal(null)}>
            ＋ Register Owner
          </button>
          <button className="btn btn-pri" onClick={() => handleOpenFUModal(null)}>
            ＋ New Follow-Up
          </button>
        </div>
      </div>

      <div className="tabrow rise" style={{ animationDelay: '.05s' }}>
        <button className={activeTab === 'tracker' ? 'on' : ''} onClick={() => setActiveTab('tracker')}>
          Tracker
        </button>
        <button className={activeTab === 'owners' ? 'on' : ''} onClick={() => setActiveTab('owners')}>
          Owners Directory
        </button>
      </div>

      {activeTab === 'tracker' ? (
        <div id="fuTracker">
          <div className="card rise" style={{ animationDelay: '.1s' }}>
            <div className="tblwrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Date of Contact</th>
                    <th>Owner / Contact</th>
                    <th>Property Name / Address</th>
                    <th>Status / Outcome</th>
                    <th>Next Follow-Up</th>
                    <th>Manager / Action Required</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {followups.map(f => {
                    const d = f.next ? daysUntil(f.next) : null;
                    const isOverdue = d !== null && d < 0 && !['Closed - Won', 'Lost'].includes(f.status);

                    return (
                      <tr key={f.id} style={isOverdue ? { background: '#FBF1EA' } : undefined}>
                        <td>
                          <div className="dt-cell">
                            <strong>{fmtD(f.doc)}</strong>
                          </div>
                        </td>
                        <td>
                          <b>{f.name}</b>
                          <div className="mono" style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                            {f.phone || ''}
                          </div>
                        </td>
                        <td className="addr">{f.property}</td>
                        <td>
                          <span className={`chip ${fuColorClass(f.status)}`} style={{ border: 'none' }}>
                            {f.status}
                          </span>
                        </td>
                        <td>
                          {f.next ? (
                            <>
                              <b style={isOverdue ? { color: 'var(--clay)' } : undefined}>{fmtD(f.next)}</b>
                              {isOverdue ? (
                                <div style={{ font: "600 10px 'IBM Plex Mono'", color: 'var(--clay)' }}>
                                  OVERDUE {-d}d
                                </div>
                              ) : d === 0 ? (
                                <div style={{ font: "600 10px 'IBM Plex Mono'", color: 'var(--gold)' }}>
                                  TODAY
                                </div>
                              ) : null}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="notes" style={{ color: 'var(--ink)' }}>
                          {f.action || '—'}
                        </td>
                        <td>
                          <div className="rowact">
                            <button
                              className="icobtn"
                              onClick={() => onBookShootForOwner({ name: f.name, phone: f.phone, address: f.property })}
                              title="Book a shoot for this lead"
                            >
                              <Icon name="cam" />
                            </button>
                            <button className="icobtn" onClick={() => handleOpenFUModal(f)} title="Edit">
                              <Icon name="edit" />
                            </button>
                            <button className="icobtn danger" onClick={() => handleDeleteFU(f.id)} title="Delete">
                              <Icon name="trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div id="fuOwners">
          <div className="card rise">
            <div className="tblwrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Owner / Contact</th>
                    <th>Phone</th>
                    <th>Notes</th>
                    <th>Follow-Ups</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map(o => (
                    <tr key={o.id}>
                      <td>
                        <b>{o.name}</b>
                      </td>
                      <td className="mono" style={{ fontSize: '12.5px' }}>
                        {o.phone}
                      </td>
                      <td className="notes">{o.notes || '—'}</td>
                      <td>
                        <span className="count-pill" style={{ background: 'var(--gold)' }}>
                          {db.followups.filter(f => f.name === o.name).length}
                        </span>
                      </td>
                      <td>
                        <div className="rowact">
                          <button
                            className="icobtn"
                            onClick={() => onBookShootForOwner({ name: o.name, phone: o.phone })}
                            title="Book visit"
                          >
                            <Icon name="cam" />
                          </button>
                          <button className="icobtn" onClick={() => handleOpenOwnerModal(o)} title="Edit">
                            <Icon name="edit" />
                          </button>
                          <button className="icobtn danger" onClick={() => handleDeleteOwner(o.id)} title="Delete">
                            <Icon name="trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Follow-Up Modal */}
      <Modal
        isOpen={isFUModalOpen}
        title={editingFU ? 'Edit Follow-Up' : 'New Owner Follow-Up'}
        onClose={() => setIsFUModalOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsFUModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-pri" onClick={handleSaveFU}>
              Save Follow-Up
            </button>
          </>
        }
      >
        <div className="fgrid">
          <div className="fld">
            <label>Date of Contact</label>
            <input className="inp" type="date" value={fDoc} onChange={e => setFDoc(e.target.value)} />
          </div>

          <div className="fld">
            <label>Registered owner</label>
            <select className="inp" value={fOwnerSrc} onChange={e => handleOwnerSrcChange(e.target.value)}>
              <option value="">— manual entry —</option>
              {db.owners.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="fld">
            <label>Owner / Contact Name *</label>
            <input className="inp" value={fName} onChange={e => setFName(e.target.value)} />
          </div>

          <div className="fld">
            <label>Phone</label>
            <input className="inp mono" value={fPhone} onChange={e => setFPhone(e.target.value)} />
          </div>

          <div className="fld full">
            <label>Property Name / Address *</label>
            <input className="inp" value={fProp} onChange={e => setFProp(e.target.value)} placeholder="e.g. Summit Residential" />
          </div>

          <div className="fld">
            <label>Status / Outcome</label>
            <select className="inp" value={fStatus} onChange={e => setFStatus(e.target.value as FollowUpStatus)}>
              {FU_STATUSES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="fld">
            <label>Next Follow-Up Date</label>
            <input className="inp" type="date" value={fNext} onChange={e => setFNext(e.target.value)} />
          </div>

          <div className="fld full">
            <label>Manager / Action Required</label>
            <input className="inp" value={fAction} onChange={e => setFAction(e.target.value)} placeholder="e.g. Confirm pricing with Head of Sales" />
          </div>
        </div>
      </Modal>

      {/* Owner Modal */}
      <Modal
        isOpen={isOwnerModalOpen}
        title={editingOwner ? 'Edit Owner' : 'Register Building Owner'}
        onClose={() => setIsOwnerModalOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsOwnerModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-pri" onClick={handleSaveOwner}>
              Save
            </button>
          </>
        }
      >
        <div className="fgrid">
          <div className="fld">
            <label>Owner / Contact Name *</label>
            <input className="inp" value={oName} onChange={e => setOName(e.target.value)} placeholder="Ato / W/ro …" />
          </div>
          <div className="fld">
            <label>Phone *</label>
            <input className="inp mono" value={oPhone} onChange={e => setOPhone(e.target.value)} />
          </div>
          <div className="fld full">
            <label>Notes</label>
            <textarea className="inp" value={oNotes} onChange={e => setONotes(e.target.value)} />
          </div>
        </div>
      </Modal>
    </section>
  );
}
