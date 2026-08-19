'use client';

import React, { useState } from 'react';
import { LogoTile } from '@/lib/icons';
import { Session, User } from '@/types';

interface AuthViewProps {
  users: User[];
  onLogin: (session: Session) => void;
}

export function AuthView({ users, onLogin }: AuthViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('demo login — user: admin · pass: dashomes');
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    const p = password;
    const user = users.find(x => x.u === u && x.p === p);

    if (!user) {
      setShake(true);
      setErrorMsg('⚠ invalid credentials — try admin / dashomes');
      setTimeout(() => setShake(false), 450);
      return;
    }

    const session: Session = {
      u: user.u,
      name: user.name,
      role: user.role
    };

    onLogin(session);
  };

  return (
    <div id="auth">
      <div className="auth-left">
        <div className="auth-brandrow">
          <LogoTile size={64} className="auth-logo-tile" />
          <div>
            <b>DAS HOMES</b>
            <span>CALLCENTER · ADDIS ABABA</span>
          </div>
        </div>
        <div className="auth-hero">
          <h1>
            Every call,
            <br />
            <em>pinned.</em>
          </h1>
          <p>
            The operations desk for Das Homes — broker photo-shoot scheduling, building-owner follow-ups, property intake and color-coded field teams, all on one map and one calendar.
          </p>
        </div>
        <div className="auth-tiles">
          <span>BROKER DESK</span>
          <span>OWNER FOLLOW-UP</span>
          <span>FIELD TEAMS</span>
          <span>SHOOT CALENDAR</span>
        </div>
        <svg className="sky" viewBox="0 0 900 190" fill="none" stroke="#F3EEDD" strokeWidth="1.5">
          <path d="M0 189h900M40 189V96h70v93M110 189V58h56v131M166 189V120h92v69M258 189V40h64v149M322 189V98h84v91M406 189V22h72v167M478 189V76h60v113M538 189V128h96v61M634 189V50h66v139M700 189V104h80v85M780 189V64h70v125M850 189V132h50v57" />
          <path
            d="M55 112h40M55 132h40M55 152h40M124 74h28M124 94h28M124 114h28M124 134h28M274 60h32M274 82h32M274 104h32M422 42h40M422 66h40M422 90h40M422 114h40M650 70h34M650 92h34M650 114h34M800 84h32M800 106h32"
            opacity=".5"
          />
        </svg>
      </div>

      <div className="auth-right">
        <form className={`auth-card ${shake ? 'shake' : ''}`} onSubmit={handleSubmit}>
          <LogoTile size={62} className="auth-logo" />
          <h2>Sign in to the desk</h2>
          <p>Operations console · internal use only</p>
          <div className="fld" style={{ marginBottom: '14px' }}>
            <label>Username</label>
            <input
              className="inp"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="fld" style={{ marginBottom: '22px' }}>
            <label>Password</label>
            <input
              className="inp"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '13px' }} type="submit">
            Enter Console →
          </button>
          
          <div style={{ marginTop: '18px', fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, marginBottom: '6px', color: '#B8862B' }}>Quick Demo Login (Password: dashomes):</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button type="button" className="btn btn-sm btn-subtle" onClick={() => { setUsername('admin'); setPassword('dashomes'); }}>
                🛡 Admin
              </button>
              <button type="button" className="btn btn-sm btn-subtle" onClick={() => { setUsername('manager'); setPassword('dashomes'); }}>
                👔 Manager (Akrem Seud)
              </button>
              <button type="button" className="btn btn-sm btn-subtle" onClick={() => { setUsername('agent'); setPassword('dashomes'); }}>
                🎧 Call Center Operator
              </button>
              <button type="button" className="btn btn-sm btn-subtle" onClick={() => { setUsername('team1'); setPassword('dashomes'); }}>
                🚗 Team 1
              </button>
              <button type="button" className="btn btn-sm btn-subtle" onClick={() => { setUsername('team2'); setPassword('dashomes'); }}>
                🚗 Team 2
              </button>
            </div>
          </div>
          
          <div className="demo-hint" style={{ marginTop: '10px' }} dangerouslySetInnerHTML={{ __html: errorMsg }} />
        </form>
      </div>
    </div>
  );
}
