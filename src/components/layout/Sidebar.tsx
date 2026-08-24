'use client';

import React from 'react';
import { Icon, LogoTile } from '@/lib/icons';
import { Session, ViewId } from '@/types';

interface SidebarProps {
  currentView: ViewId;
  onNavigate: (view: ViewId) => void;
  session: Session;
  overdueCount: number;
  todayApptCount: number;
  onResetData: () => void;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const VIEWS_META: [ViewId, string, string, string][] = [
  ['dashboard', 'Dashboard', 'grid', 'Operations overview'],
  ['appointments', 'Appointments', 'cam', 'Broker & owner photo-shoot log'],
  ['schedule', 'Schedule', 'cal', 'Month calendar of shoots'],
  ['map', 'Field Map', 'pin', 'Every visit pinned by team color'],
  ['brokers', 'Brokers', 'users', 'Registry · active/inactive'],
  ['properties', 'Properties', 'home', 'Intake with or without photos'],
  ['followups', 'Follow-Ups', 'phone', 'Building owner tracker'],
  ['teams', 'Teams', 'cam', 'Color-coded field units'],
  ['users', 'User Accounts', 'users', 'Admin user roles & credentials console'],
  ['analytics', 'Analytics', 'chart', 'Pipeline signals']
];

export function Sidebar({
  currentView,
  onNavigate,
  session,
  overdueCount,
  todayApptCount,
  onResetData,
  onLogout,
  isOpenMobile,
  onCloseMobile
}: SidebarProps) {
  const initials = session.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleNavClick = (id: ViewId) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {isOpenMobile && (
        <div className="sidebar-backdrop" onClick={onCloseMobile} />
      )}
      <aside id="sidebar" className={isOpenMobile ? 'open' : ''}>
        <div className="side-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LogoTile size={44} />
            <div>
              <b>Das Homes</b>
              <span>CALLCENTER</span>
            </div>
          </div>
          {onCloseMobile && (
            <button className="sidebar-close-btn" onClick={onCloseMobile} title="Close Menu">
              ✕
            </button>
          )}
        </div>

        <nav id="nav">
          {VIEWS_META.filter(([id]) => {
            const role = session.role;
            if (role === 'System Administrator') return true;
            if (role === 'Property & Broker Manager') {
              return ['brokers', 'properties', 'teams', 'schedule', 'analytics'].includes(id);
            }
            if (role === 'Call Center Operator') {
              return ['dashboard', 'appointments', 'schedule', 'map', 'brokers', 'properties', 'followups', 'teams', 'analytics'].includes(id);
            }
            if (role === 'Team Member (Field Agent)') {
              return ['schedule', 'map', 'brokers', 'properties'].includes(id);
            }
            return true;
          }).map(([id, label, icon]) => (
            <a
              key={id}
              className={`nav-it ${id === currentView ? 'active' : ''}`}
              onClick={() => handleNavClick(id)}
            >
              <Icon name={icon} size={19} />
              <span>{label}</span>
              {id === 'followups' && overdueCount > 0 && (
                <em className="nav-badge" id="badgeFU">
                  {overdueCount}
                </em>
              )}
              {id === 'appointments' && todayApptCount > 0 && (
                <em className="nav-badge" id="badgeAP" style={{ background: 'var(--sage)' }}>
                  {todayApptCount}
                </em>
              )}
            </a>
          ))}
        </nav>

        <div className="side-foot">
          <div className="user-chip">
            <div className="avatar" id="userAvatar">
              {initials}
            </div>
            <div>
              <b id="userName">{session.name}</b>
              <span id="userRole">{session.role}</span>
            </div>
          </div>
          <div className="side-links">
            <button onClick={() => { onResetData(); if (onCloseMobile) onCloseMobile(); }} title="Reset demo data">
              ↺ Reset data
            </button>
            <button onClick={() => { onLogout(); if (onCloseMobile) onCloseMobile(); }}>Logout</button>
          </div>
        </div>
      </aside>
    </>
  );
}
