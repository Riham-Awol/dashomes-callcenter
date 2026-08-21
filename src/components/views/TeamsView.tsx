'use client';

import React, { useState } from 'react';
import { DatabaseSchema, Team, TeamMember } from '@/types';
import { TEAM_COLORS } from '@/lib/storage';
import { todayYMD, uid } from '@/lib/utils';
import { Icon } from '@/lib/icons';
import { Modal } from '@/components/ui/Modal';

interface TeamsViewProps {
  db: DatabaseSchema;
  searchQuery: string;
  onUpdateDatabase: (updater: (draft: DatabaseSchema) => void) => void;
  onToast: (msg: string, isErr?: boolean) => void;
  onAskConfirm: (msg: string, onConfirm: () => void) => void;
}

export function TeamsView({
  db,
  searchQuery,
  onUpdateDatabase,
  onToast,
  onAskConfirm
}: TeamsViewProps) {
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [color, setColor] = useState(TEAM_COLORS[0]);
  const [lead, setLead] = useState('');
  const [phone, setPhone] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');

  let teams = db.teams;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    teams = teams.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        (t.lead && t.lead.toLowerCase().includes(q)) ||
        t.members.some(m => m.name.toLowerCase().includes(q) || m.phone.toLowerCase().includes(q))
    );
  }

  const handleOpenModal = (t?: Team | null) => {
    if (t) {
      setEditingTeam(t);
      setName(t.name);
      setColor(t.color);
      setLead(t.lead || '');
      setPhone(t.phone || '');
      setMembers(t.members || []);
    } else {
      setEditingTeam(null);
      setName('');
      setColor(TEAM_COLORS[db.teams.length % TEAM_COLORS.length]);
      setLead('');
      setPhone('');
      setMembers([]);
    }
    setMemberName('');
    setMemberPhone('');
    setIsModalOpen(true);
  };

  const handleAddMember = () => {
    if (!memberName.trim() || !memberPhone.trim()) {
      return onToast('Member name and phone are required.', true);
    }
    const newMem: TeamMember = {
      id: uid(),
      name: memberName.trim(),
      phone: memberPhone.trim()
    };
    setMembers(prev => [...prev, newMem]);
    if (!lead) setLead(memberName.trim());
    if (!phone) setPhone(memberPhone.trim());
    setMemberName('');
    setMemberPhone('');
  };

  const handleRemoveMember = (memId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memId));
  };

  const handleSave = () => {
    if (!name.trim()) {
      return onToast('Team name is required.', true);
    }

    onUpdateDatabase(draft => {
      const rec: Team = {
        id: editingTeam ? editingTeam.id : uid(),
        name: name.trim(),
        color,
        lead: lead.trim() || (members[0]?.name || 'Unassigned'),
        phone: phone.trim() || (members[0]?.phone || ''),
        date: todayYMD(),
        members
      };

      if (editingTeam) {
        const idx = draft.teams.findIndex(t => t.id === editingTeam.id);
        if (idx !== -1) draft.teams[idx] = rec;
      } else {
        draft.teams.push(rec);
        draft.activity.unshift({ ts: Date.now(), text: `Daily field team created: ${rec.name} (${rec.members.length} members).` });
      }
      draft.activity = draft.activity.slice(0, 40);
    });

    setIsModalOpen(false);
    onToast('Team saved ✓');
  };

  const handleDelete = (t: Team) => {
    const n = db.appointments.filter(a => a.teamId === t.id).length;
    onAskConfirm(`Delete ${t.name}? ${n} appointment(s) will become unassigned.`, () => {
      onUpdateDatabase(draft => {
        draft.appointments.forEach(a => {
          if (a.teamId === t.id) a.teamId = '';
        });
        draft.teams = draft.teams.filter(x => x.id !== t.id);
      });
      onToast('Team deleted');
    });
  };

  return (
    <section className="view on" id="view-teams">
      <div className="pagehead rise">
        <div>
          <div className="ph-title">Dynamic Field Teams & Members</div>
          <div className="ph-sub">Property & Broker Managers create daily teams and register active members</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-pri" onClick={() => handleOpenModal(null)}>
            ＋ Create Daily Team
          </button>
        </div>
      </div>

      <div className="team-grid" id="teamGrid">
        {teams.map((t, i) => {
          const appts = db.appointments.filter(a => a.teamId === t.id);
          const done = appts.filter(a => a.status === 'Completed').length;
          const upcoming = appts.filter(a => new Date(a.dt) >= new Date(todayYMD() + 'T00:00')).length;

          return (
            <div key={t.id} className="team-card rise" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="team-band" style={{ background: t.color }} />
              <div className="team-body">
                <h4>
                  <span className="sw" style={{ background: t.color }} />
                  {t.name}
                </h4>
                
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>
                  Registered Members ({t.members?.length || 0}):
                </div>
                
                <div className="team-member-list">
                  {t.members?.length ? (
                    t.members.map(m => (
                      <div key={m.id} className="team-member-row">
                        <b className="team-member-name">{m.name}</b>
                        <span className="team-member-phone mono">{m.phone}</span>
                      </div>
                    ))
                  ) : (
                    <div className="team-empty-member">Lead: {t.lead || 'No registered members'} ({t.phone})</div>
                  )}
                </div>

                <div className="team-stats">
                  <div>
                    <b>{appts.length}</b>
                    <span>Assigned</span>
                  </div>
                  <div>
                    <b>{done}</b>
                    <span>Done</span>
                  </div>
                  <div>
                    <b>{upcoming}</b>
                    <span>Upcoming</span>
                  </div>
                </div>
                
                <div className="rowact" style={{ marginTop: '12px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(t)}>
                    <Icon name="edit" /> Edit Team
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t)}>
                    <Icon name="trash" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Team Form Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingTeam ? 'Edit Team & Members' : 'Create Daily Field Team'}
        onClose={() => setIsModalOpen(false)}
        wide
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-pri" onClick={handleSave}>
              Save Team
            </button>
          </>
        }
      >
        <div className="fgrid">
          <div className="fld">
            <label>Team Name *</label>
            <input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Team Alpha, Team Beta" />
          </div>
          
          <div className="fld">
            <label>Team Color</label>
            <div className="swatches">
              {TEAM_COLORS.map(c => (
                <span
                  key={c}
                  className={`swb ${color === c ? 'sel' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{ width: '34px', height: '30px', border: 'none', background: 'none', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="fld full" style={{ background: 'var(--cream2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--sageline)' }}>
            <b style={{ fontSize: '12px', display: 'block', marginBottom: '8px', color: '#2E4632' }}>Register Team Members (Name & Phone Number):</b>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input className="inp" style={{ flex: 1 }} value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Member Name" />
              <input className="inp mono" style={{ flex: 1 }} value={memberPhone} onChange={e => setMemberPhone(e.target.value)} placeholder="Member Phone (+251 9…)" />
              <button type="button" className="btn btn-sec btn-sm" onClick={handleAddMember}>
                ＋ Add Member
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--sageline)' }}>
                  <div>
                    <b>{m.name}</b> <span className="mono" style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '8px' }}>{m.phone}</span>
                  </div>
                  <button type="button" className="icobtn danger" onClick={() => handleRemoveMember(m.id)}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
}
