'use client';

import React, { useState } from 'react';
import { ApprovalStatus, Broker, DatabaseSchema, Session } from '@/types';
import { exportCSV, exportToWordDoc, uid } from '@/lib/utils';
import { Icon } from '@/lib/icons';
import { Modal } from '@/components/ui/Modal';

interface BrokersViewProps {
  db: DatabaseSchema;
  session: Session;
  searchQuery: string;
  onUpdateDatabase: (updater: (draft: DatabaseSchema) => void) => void;
  onToast: (msg: string, isErr?: boolean) => void;
  onAskConfirm: (msg: string, onConfirm: () => void) => void;
  onBookShootForBroker: (broker: Broker) => void;
}

export function BrokersView({
  db,
  session,
  searchQuery,
  onUpdateDatabase,
  onToast,
  onAskConfirm,
  onBookShootForBroker
}: BrokersViewProps) {
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBrokerPortfolio, setSelectedBrokerPortfolio] = useState<Broker | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);

  const canApprove = session.role === 'System Administrator' || session.role === 'Property & Broker Manager';

  let brokers = db.brokers;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    brokers = brokers.filter(
      b =>
        b.name.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q) ||
        (b.area && b.area.toLowerCase().includes(q)) ||
        b.notes.toLowerCase().includes(q)
    );
  }

  const counts = (id: string) => db.appointments.filter(a => a.kind === 'broker' && a.contactId === id).length;

  const handleToggleActive = (id: string) => {
    onUpdateDatabase(draft => {
      const b = draft.brokers.find(x => x.id === id);
      if (b) {
        b.active = !b.active;
        onToast(`${b.name} is now ${b.active ? 'ACTIVE' : 'inactive'}`);
      }
    });
  };

  const handleApprovalChange = (id: string, status: ApprovalStatus) => {
    onUpdateDatabase(draft => {
      const b = draft.brokers.find(x => x.id === id);
      if (b) {
        b.approvalStatus = status;
        draft.activity.unshift({
          ts: Date.now(),
          text: `Manager ${session.name} updated approval status for ${b.name} to ${status}.`
        });
        onToast(`Broker ${b.name} marked as ${status}`);
      }
    });
  };

  const handleDelete = (id: string) => {
    onAskConfirm('Delete this broker?', () => {
      onUpdateDatabase(draft => {
        draft.brokers = draft.brokers.filter(x => x.id !== id);
      });
      onToast('Deleted');
    });
  };

  const handleOpenModal = (b?: Broker | null) => {
    if (b) {
      setEditingBroker(b);
      setName(b.name);
      setPhone(b.phone);
      setAddress(b.address || '');
      setArea(b.area || '');
      setNotes(b.notes);
      setActive(b.active);
    } else {
      setEditingBroker(null);
      setName('');
      setPhone('');
      setAddress('');
      setArea('');
      setNotes('');
      setActive(true);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      return onToast('Name and phone are required.', true);
    }

    onUpdateDatabase(draft => {
      const rec: Broker = {
        id: editingBroker ? editingBroker.id : uid(),
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        area: area.trim(),
        notes: notes.trim(),
        active,
        approvalStatus: editingBroker ? editingBroker.approvalStatus : canApprove ? 'Approved' : 'Pending'
      };

      if (editingBroker) {
        const idx = draft.brokers.findIndex(x => x.id === editingBroker.id);
        if (idx !== -1) draft.brokers[idx] = rec;
        draft.activity.unshift({ ts: Date.now(), text: `Broker updated: ${rec.name}.` });
      } else {
        draft.brokers.push(rec);
        draft.activity.unshift({
          ts: Date.now(),
          text: `Broker registered: ${rec.name} (${rec.approvalStatus}).`
        });
      }
      draft.activity = draft.activity.slice(0, 40);
    });

    setIsModalOpen(false);
    onToast('Saved ✓');
  };

  const handleExportWord = () => {
    const cols = ['Broker Name', 'Phone', 'Address', 'Area', 'Approval Status', 'Active Status', 'Notes'];
    const rows = db.brokers.map(b => [
      b.name,
      b.phone,
      b.address || '—',
      b.area || '—',
      b.approvalStatus || 'Approved',
      b.active ? 'Active' : 'Inactive',
      b.notes || '—'
    ]);
    exportToWordDoc('Das Homes Broker Registry Report', cols, rows, 'dashomes-brokers-report');
  };

  return (
    <section className="view on" id="view-brokers">
      <div className="pagehead rise">
        <div>
          <div className="ph-title">Broker Registry</div>
          <div className="ph-sub">
            Approved brokers appear in the Call Center Operator appointment scheduler
          </div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-ghost" onClick={handleExportWord} title="Export Word Document">
            📄 Export Word
          </button>
          <button className="btn btn-ghost" onClick={() => exportCSV('brokers', db)}>
            ⇩ Export CSV
          </button>
          <button className="btn btn-pri" onClick={() => handleOpenModal(null)}>
            ＋ Register Broker
          </button>
        </div>
      </div>

      <div className="card rise" style={{ animationDelay: '.08s' }}>
        <div className="tblwrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Broker Name</th>
                <th>Phone</th>
                <th>Address / Area</th>
                <th>Approval</th>
                <th>Active</th>
                <th>Shoots</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brokers.map(b => {
                const status = b.approvalStatus || 'Approved';
                return (
                  <tr key={b.id}>
                    <td>
                      <b
                        style={{ cursor: 'pointer', color: 'var(--gold)', textDecoration: 'underline' }}
                        onClick={() => setSelectedBrokerPortfolio(b)}
                        title="Click to view broker portfolio & bookings"
                      >
                        {b.name} 📂
                      </b>
                    </td>
                    <td className="mono" style={{ fontSize: '12.5px' }}>
                      {b.phone}
                    </td>
                    <td>
                      <div>{b.address || '—'}</div>
                      {b.area && <span className="mono" style={{ fontSize: '11px', opacity: 0.7 }}>{b.area}</span>}
                    </td>
                    <td>
                      <span className={`chip ${status === 'Approved' ? 'ch-green' : status === 'Pending' ? 'ch-gold' : 'ch-clay'}`}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <button
                          className={`switch ${b.active ? 'on' : ''}`}
                          onClick={() => handleToggleActive(b.id)}
                          title="Toggle active status"
                        />
                        <span style={{ fontSize: '12px' }}>{b.active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="count-pill" style={{ background: 'var(--sage)' }}>
                        {counts(b.id)}
                      </span>
                    </td>
                    <td>
                      <div className="rowact">
                        {canApprove && status === 'Pending' && (
                          <>
                            <button className="btn btn-sm btn-gold" onClick={() => handleApprovalChange(b.id, 'Approved')} title="Approve">
                              ✓ Approve
                            </button>
                            <button className="btn btn-sm btn-subtle" onClick={() => handleApprovalChange(b.id, 'Rejected')} title="Reject">
                              ✕ Reject
                            </button>
                          </>
                        )}
                        <button className="icobtn" onClick={() => onBookShootForBroker(b)} title="Book Shoot">
                          <Icon name="cam" />
                        </button>
                        <button className="icobtn" onClick={() => handleOpenModal(b)} title="Edit">
                          <Icon name="edit" />
                        </button>
                        <button className="icobtn danger" onClick={() => handleDelete(b.id)} title="Delete">
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingBroker ? 'Edit Broker' : 'Register Broker'}
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-pri" onClick={handleSave}>
              {editingBroker ? 'Save' : 'Register'}
            </button>
          </>
        }
      >
        <div className="fgrid">
          <div className="fld">
            <label>Broker Name *</label>
            <input className="inp" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="fld">
            <label>Phone Number *</label>
            <input className="inp mono" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+251 9…" />
          </div>
          <div className="fld">
            <label>Address</label>
            <input className="inp" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street / Subcity address" />
          </div>
          <div className="fld">
            <label>Area / Neighborhood</label>
            <input className="inp" value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Bole Atlas, CMC, Kazanchis" />
          </div>
          <div className="fld full">
            <label>Notes</label>
            <textarea className="inp" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special preferences, preferred shoot times…" />
          </div>
          <div className="fld full">
            <label>Status</label>
            <div className="pillgrp">
              <label>
                <input type="radio" name="bact" value="1" checked={active} onChange={() => setActive(true)} />
                <span>● Active</span>
              </label>
              <label>
                <input type="radio" name="bact" value="0" checked={!active} onChange={() => setActive(false)} />
                <span>○ Inactive</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Broker Portfolio Pop-Up Modal */}
      <Modal
        isOpen={selectedBrokerPortfolio !== null}
        title={`Broker Portfolio — ${selectedBrokerPortfolio?.name}`}
        onClose={() => setSelectedBrokerPortfolio(null)}
        wide
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setSelectedBrokerPortfolio(null)}>
              Close Portfolio
            </button>
            {selectedBrokerPortfolio && (
              <button
                className="btn btn-pri"
                onClick={() => {
                  const b = selectedBrokerPortfolio;
                  setSelectedBrokerPortfolio(null);
                  onBookShootForBroker(b);
                }}
              >
                📸 Book Shoot with Broker
              </button>
            )}
          </>
        }
      >
        {selectedBrokerPortfolio && (
          <div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', background: 'var(--cream2)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--sageline)' }}>
              <div>
                <b style={{ fontSize: '16px', color: '#2E4632' }}>{selectedBrokerPortfolio.name}</b>
                <div className="mono" style={{ fontSize: '13px', color: 'var(--muted)' }}>{selectedBrokerPortfolio.phone}</div>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>Area: <b>{selectedBrokerPortfolio.area || 'Addis Ababa'}</b> · {selectedBrokerPortfolio.address || ''}</div>
              </div>
            </div>

            {/* Properties brought by broker */}
            <h4 style={{ color: '#2E4632', marginBottom: '8px', font: "700 16px 'Fraunces', serif" }}>
              Properties Brought by Broker ({db.properties.filter(p => p.brokerId === selectedBrokerPortfolio.id || p.owner === selectedBrokerPortfolio.name).length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {(() => {
                const propsBrought = db.properties.filter(
                  p => p.brokerId === selectedBrokerPortfolio.id || p.owner === selectedBrokerPortfolio.name
                );
                if (!propsBrought.length) return <div style={{ fontSize: '12.5px', fontStyle: 'italic', color: 'var(--muted)' }}>No properties registered by this broker yet.</div>;
                return propsBrought.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--sageline)' }}>
                    <div>
                      <b>{p.name}</b> <span className="chip ch-blue" style={{ fontSize: '10px', padding: '1px 6px' }}>{p.type}</span>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>📍 {p.address}</div>
                    </div>
                    <div>
                      <b style={{ color: '#B8862B' }}>{p.price ? `ETB ${p.price.toLocaleString()}` : '—'}</b>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Bookings & Shoots for broker */}
            <h4 style={{ color: '#2E4632', marginBottom: '8px', font: "700 16px 'Fraunces', serif" }}>
              Bookings & Shoot History ({db.appointments.filter(a => a.contactId === selectedBrokerPortfolio.id || a.name === selectedBrokerPortfolio.name).length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(() => {
                const bookings = db.appointments.filter(
                  a => a.contactId === selectedBrokerPortfolio.id || a.name === selectedBrokerPortfolio.name
                );
                if (!bookings.length) return <div style={{ fontSize: '12.5px', fontStyle: 'italic', color: 'var(--muted)' }}>No bookings or shoots recorded yet.</div>;
                return bookings.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--sageline)' }}>
                    <div>
                      <b>{a.address}</b>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>📅 {new Date(a.dt).toLocaleString()}</div>
                    </div>
                    <span className={`chip s-${a.status}`}>{a.status}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
