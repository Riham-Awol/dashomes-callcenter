'use client';

import React, { useState } from 'react';
import { DatabaseSchema, Session, User, UserRole } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { exportToWordDoc } from '@/lib/utils';

interface UsersViewProps {
  db: DatabaseSchema;
  session: Session;
  searchQuery: string;
  onUpdateDatabase: (updater: (draft: DatabaseSchema) => void) => void;
  onToast: (msg: string) => void;
  onAskConfirm: (msg: string, onConfirm: () => void) => void;
}

export function UsersView({
  db,
  session,
  searchQuery,
  onUpdateDatabase,
  onToast,
  onAskConfirm
}: UsersViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Call Center Operator');
  const [teamId, setTeamId] = useState<string>('');

  const users = db.users.filter(usr => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      usr.u.toLowerCase().includes(q) ||
      usr.name.toLowerCase().includes(q) ||
      usr.role.toLowerCase().includes(q)
    );
  });

  const handleOpenModal = (user?: User | null) => {
    if (user) {
      setEditingUser(user);
      setU(user.u);
      setP(user.p);
      setName(user.name);
      setRole(user.role);
      setTeamId(user.teamId || '');
    } else {
      setEditingUser(null);
      setU('');
      setP('');
      setName('');
      setRole('Call Center Operator');
      setTeamId('');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!u.trim() || !p.trim() || !name.trim()) {
      onToast('⚠ Username, password, and full name are required.');
      return;
    }

    onUpdateDatabase(draft => {
      const rec: User = {
        u: u.trim(),
        p: p.trim(),
        name: name.trim(),
        role,
        teamId: teamId || undefined
      };

      const idx = draft.users.findIndex(x => x.u.toLowerCase() === u.trim().toLowerCase());
      if (editingUser) {
        if (idx !== -1) {
          draft.users[idx] = rec;
        }
        draft.activity.unshift({
          ts: Date.now(),
          text: `Admin updated user credentials for ${rec.name} (${rec.u}).`
        });
      } else {
        if (idx !== -1) {
          onToast('⚠ Username already exists!');
          return;
        }
        draft.users.push(rec);
        draft.activity.unshift({
          ts: Date.now(),
          text: `Admin created new user account for ${rec.name} (${rec.role}).`
        });
      }
    });

    setIsModalOpen(false);
    onToast('User account saved ✓');
  };

  const handleDelete = (username: string) => {
    if (username === session.u) {
      onToast('⚠ You cannot delete your own logged-in account!');
      return;
    }
    onAskConfirm(`Delete user account "${username}"?`, () => {
      onUpdateDatabase(draft => {
        draft.users = draft.users.filter(x => x.u !== username);
        draft.activity.unshift({
          ts: Date.now(),
          text: `Admin deleted user account: ${username}.`
        });
      });
      onToast('User account deleted');
    });
  };

  const handleExportWord = () => {
    const cols = ['Username', 'Full Name', 'Role', 'Assigned Team', 'Password'];
    const rows = db.users.map(usr => [
      usr.u,
      usr.name,
      usr.role,
      usr.teamId ? db.teams.find(t => t.id === usr.teamId)?.name || usr.teamId : '—',
      usr.p
    ]);
    exportToWordDoc('Das Homes System User Accounts Report', cols, rows, 'dashomes-users-report');
  };

  return (
    <section className="view on" id="view-users">
      <div className="pagehead rise">
        <div>
          <div className="ph-title">User Account & Permission Management</div>
          <div className="ph-sub">System Administrator console for managing user roles & credentials</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-ghost" onClick={handleExportWord}>
            📄 Export Word
          </button>
          <button className="btn btn-pri" onClick={() => handleOpenModal(null)}>
            ＋ Create User Account
          </button>
        </div>
      </div>

      <div className="card rise" style={{ animationDelay: '.08s' }}>
        <div className="tblwrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>User Role</th>
                <th>Assigned Team</th>
                <th>Password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(usr => (
                <tr key={usr.u}>
                  <td>
                    <b className="mono">{usr.u}</b>
                  </td>
                  <td>
                    <b>{usr.name}</b>
                  </td>
                  <td>
                    <span className="chip ch-blue">{usr.role}</span>
                  </td>
                  <td>
                    {usr.teamId ? (
                      <span className="mono" style={{ fontSize: '12px' }}>
                        {db.teams.find(t => t.id === usr.teamId)?.name || usr.teamId}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    •••••• ({usr.p})
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(usr)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(usr.u)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        title={editingUser ? 'Edit User Account' : 'Create New User Account'}
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-pri" onClick={handleSave}>
              Save User Account
            </button>
          </>
        }
      >
        <div className="fgrid">
          <div className="fld">
            <label>Username *</label>
            <input className="inp mono" value={u} onChange={e => setU(e.target.value)} disabled={editingUser !== null} placeholder="e.g. team1, manager" />
          </div>

          <div className="fld">
            <label>Password *</label>
            <input className="inp mono" value={p} onChange={e => setP(e.target.value)} placeholder="Enter password..." />
          </div>

          <div className="fld full">
            <label>Full Name *</label>
            <input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Akrem Seud, Team Falcon" />
          </div>

          <div className="fld full">
            <label>User Role Permission *</label>
            <select className="inp" value={role} onChange={e => setRole(e.target.value as UserRole)}>
              <option value="System Administrator">System Administrator (Global Visibility)</option>
              <option value="Property & Broker Manager">Property & Broker Manager (Approvals & Teams)</option>
              <option value="Call Center Operator">Call Center Operator (Appointments & Follow-Ups)</option>
              <option value="Team Member (Field Agent)">Team Member (Field Agent Route View)</option>
            </select>
          </div>

          {role === 'Team Member (Field Agent)' && (
            <div className="fld full">
              <label>Assigned Field Team</label>
              <select className="inp" value={teamId} onChange={e => setTeamId(e.target.value)}>
                <option value="">— Select Team —</option>
                {db.teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Modal>
    </section>
  );
}
