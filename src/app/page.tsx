'use client';

import React, { useEffect, useState } from 'react';
import { Appointment, DatabaseSchema, Session, ViewId } from '@/types';
import { loadDatabase, loadDatabaseAsync, loadSession, resetDatabase, saveDatabase, saveSession } from '@/lib/storage';
import { daysUntil, isToday } from '@/lib/utils';
import { AuthView } from '@/components/auth/AuthView';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ToastContainer, ToastMessage } from '@/components/ui/Toast';
import { AskConfirmModal } from '@/components/ui/Modal';

import { DashboardView } from '@/components/views/DashboardView';
import { AppointmentsView } from '@/components/views/AppointmentsView';
import { ScheduleView } from '@/components/views/ScheduleView';
import { MapView } from '@/components/views/MapView';
import { BrokersView } from '@/components/views/BrokersView';
import { PropertiesView } from '@/components/views/PropertiesView';
import { FollowUpsView } from '@/components/views/FollowUpsView';
import { TeamsView } from '@/components/views/TeamsView';
import { UsersView } from '@/components/views/UsersView';
import { AnalyticsView } from '@/components/views/AnalyticsView';

export default function Home() {
  const [db, setDb] = useState<DatabaseSchema | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<ViewId>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Confirmation Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });

  // Global Appointment Modal Trigger State
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [apptPrefill, setApptPrefill] = useState<Partial<Appointment> | null>(null);

  useEffect(() => {
    // Initial sync with local storage
    setDb(loadDatabase());
    setSession(loadSession());

    // Async fetch from Supabase (if configured)
    loadDatabaseAsync().then((remoteDb: DatabaseSchema) => {
      if (remoteDb) setDb(remoteDb);
    });
  }, []);

  useEffect(() => {
    if (session?.role === 'Property & Broker Manager') {
      const allowedViews: ViewId[] = ['brokers', 'properties', 'teams', 'schedule', 'analytics'];
      if (!allowedViews.includes(currentView)) {
        setCurrentView('brokers');
      }
    }
  }, [session, currentView]);

  const showToast = (msg: string, isError = false) => {
    const id = Math.random().toString(36).slice(2);
    const newToast: ToastMessage = { id, msg, isError };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.map(t => (t.id === id ? { ...t, out: true } : t)));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 320);
    }, 3400);
  };

  const updateDatabase = (updater: (draft: DatabaseSchema) => void) => {
    if (!db) return;
    const clone: DatabaseSchema = JSON.parse(JSON.stringify(db));
    updater(clone);
    saveDatabase(clone);
    setDb(clone);
  };

  const handleLogin = (newSession: Session) => {
    saveSession(newSession);
    setSession(newSession);
    if (newSession.role === 'Property & Broker Manager') {
      setCurrentView('brokers');
    } else if (newSession.role === 'Team Member (Field Agent)') {
      setCurrentView('schedule');
    } else {
      setCurrentView('dashboard');
    }
    showToast(`Welcome to the desk, ${newSession.name.split(' ')[0]} ☎`);
  };

  const handleLogout = () => {
    saveSession(null);
    setSession(null);
  };

  const handleResetData = () => {
    askConfirm('Reset all demo data? Your entries will be replaced.', () => {
      const seed = resetDatabase();
      setDb(seed);
      showToast('Demo data reset ✓');
    });
  };

  const askConfirm = (message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleNavigate = (view: ViewId) => {
    setCurrentView(view);
    setSearchQuery('');
    if (typeof window !== 'undefined') {
      const mainEl = document.getElementById('main');
      if (mainEl) mainEl.scrollTop = 0;
    }
  };

  const handleOpenApptModal = (appt?: Appointment | null, prefill?: Partial<Appointment>) => {
    setEditingAppt(appt || null);
    setApptPrefill(prefill || null);
    setIsApptModalOpen(true);
  };

  if (!db) {
    return <div style={{ minHeight: '100vh', background: 'var(--cream)' }} />;
  }

  if (!session) {
    return <AuthView users={db.users} onLogin={handleLogin} />;
  }

  const overdueCount = db.followups.filter(
    f => f.next && !['Closed - Won', 'Lost'].includes(f.status) && daysUntil(f.next) < 0
  ).length;

  const todayApptCount = db.appointments.filter(a => isToday(a.dt) && a.status !== 'Cancelled').length;

  return (
    <div id="app">
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        session={session}
        overdueCount={overdueCount}
        todayApptCount={todayApptCount}
        onResetData={handleResetData}
        onLogout={handleLogout}
      />

      <main id="main">
        <Topbar
          db={db}
          session={session}
          currentView={currentView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewAppointment={() => {
            setCurrentView('appointments');
            handleOpenApptModal(null);
          }}
        />

        <div id="content">
          {currentView === 'dashboard' && (
            <DashboardView db={db} session={session} onNavigate={handleNavigate} />
          )}

          {currentView === 'appointments' && (
            <AppointmentsView
              db={db}
              searchQuery={searchQuery}
              onUpdateDatabase={updateDatabase}
              onToast={showToast}
              onAskConfirm={askConfirm}
              editingAppt={editingAppt}
              isModalOpen={isApptModalOpen}
              onOpenModal={handleOpenApptModal}
              onCloseModal={() => setIsApptModalOpen(false)}
              prefillData={apptPrefill}
            />
          )}

          {currentView === 'schedule' && (
            <ScheduleView
              db={db}
              session={session}
              onOpenApptModal={(appt, prefill) => {
                setCurrentView('appointments');
                handleOpenApptModal(appt, prefill);
              }}
              onUpdateDatabase={updateDatabase}
              onToast={showToast}
              onAskConfirm={askConfirm}
              onNavigateMap={() => setCurrentView('map')}
            />
          )}

          {currentView === 'map' && <MapView db={db} />}

          {currentView === 'brokers' && (
            <BrokersView
              db={db}
              session={session}
              searchQuery={searchQuery}
              onUpdateDatabase={updateDatabase}
              onToast={showToast}
              onAskConfirm={askConfirm}
              onBookShootForBroker={broker => {
                setCurrentView('appointments');
                handleOpenApptModal(null, {
                  kind: 'broker',
                  name: broker.name,
                  phone: broker.phone
                });
              }}
            />
          )}

          {currentView === 'properties' && (
            <PropertiesView
              db={db}
              session={session}
              searchQuery={searchQuery}
              onUpdateDatabase={updateDatabase}
              onToast={showToast}
              onAskConfirm={askConfirm}
              onBookShootForProperty={property => {
                setCurrentView('appointments');
                handleOpenApptModal(null, {
                  kind: 'owner',
                  name: property.owner,
                  phone: property.phone,
                  address: property.address,
                  propId: property.id
                });
              }}
            />
          )}

          {currentView === 'followups' && (
            <FollowUpsView
              db={db}
              session={session}
              searchQuery={searchQuery}
              onUpdateDatabase={updateDatabase}
              onToast={showToast}
              onAskConfirm={askConfirm}
              onBookShootForOwner={owner => {
                setCurrentView('appointments');
                handleOpenApptModal(null, {
                  kind: 'owner',
                  name: owner.name,
                  phone: owner.phone,
                  address: owner.address || ''
                });
              }}
            />
          )}

          {currentView === 'teams' && (
            <TeamsView
              db={db}
              searchQuery={searchQuery}
              onUpdateDatabase={updateDatabase}
              onToast={showToast}
              onAskConfirm={askConfirm}
            />
          )}

          {currentView === 'users' && (
            <UsersView
              db={db}
              session={session}
              searchQuery={searchQuery}
              onUpdateDatabase={updateDatabase}
              onToast={showToast}
              onAskConfirm={askConfirm}
            />
          )}

          {currentView === 'analytics' && <AnalyticsView db={db} />}
        </div>
      </main>

      <ToastContainer toasts={toasts} />

      <AskConfirmModal
        isOpen={confirmConfig.isOpen}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
