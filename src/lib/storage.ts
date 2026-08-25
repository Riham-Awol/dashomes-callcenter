import { DatabaseSchema, Session } from '@/types';
import { dOff, dtOff } from './utils';
import { isSupabaseConfigured, fetchDatabaseFromSupabase, saveDatabaseToSupabase } from './supabase';

export const KEY = 'dasHomesCC_v1';
export const SESSION_KEY = 'dhs_session';


export const TEAM_COLORS = [
  '#2E4632',
  '#B8862B',
  '#3A6B94',
  '#B65C3E',
  '#6B7FA3',
  '#557C55',
  '#8A4F7D',
  '#4E4A45'
];

function isAppDataShapeCompatible(data: Partial<DatabaseSchema>): boolean {
  if (!data || !Array.isArray(data.users) || !Array.isArray(data.teams) || !Array.isArray(data.appointments)) {
    return false;
  }

  const hasValidUsers = data.users.length === 0 || data.users.some(u => typeof u === 'object' && u !== null && 'u' in u && 'p' in u);
  const hasValidAppointments = data.appointments.length === 0 || data.appointments.some(a => typeof a === 'object' && a !== null && 'kind' in a && 'dt' in a);

  return hasValidUsers && hasValidAppointments;
}

export function getSeedData(): DatabaseSchema {
  return {
    users: [
      { u: 'admin', p: 'dashomes', name: 'Akrem Seud', role: 'System Administrator' },
      { u: 'manager', p: 'dashomes', name: 'Akrem Seud', role: 'Property & Broker Manager' },
      { u: 'agent', p: 'dashomes', name: 'Front Desk Operator', role: 'Call Center Operator' },
      { u: 'team1', p: 'dashomes', name: 'Team Falcon', role: 'Team Member (Field Agent)', teamId: 't1' },
      { u: 'team2', p: 'dashomes', name: 'Team Sheba', role: 'Team Member (Field Agent)', teamId: 't2' },
      { u: 'team3', p: 'dashomes', name: 'Team Blue Nile', role: 'Team Member (Field Agent)', teamId: 't3' },
      { u: 'team4', p: 'dashomes', name: 'Team Clay', role: 'Team Member (Field Agent)', teamId: 't4' }
    ],
    teams: [
      {
        id: 't1',
        name: 'Team Falcon',
        color: '#2E4632',
        lead: 'Yonas Alemu',
        phone: '+251 91 555 0101',
        date: new Date().toISOString().slice(0, 10),
        members: [
          { id: 'm1', name: 'Yonas Alemu', phone: '+251 91 555 0101' },
          { id: 'm2', name: 'Kassahun Bekele', phone: '+251 91 555 0109' }
        ]
      },
      {
        id: 't2',
        name: 'Team Sheba',
        color: '#B8862B',
        lead: 'Meron Tadesse',
        phone: '+251 92 555 0202',
        date: new Date().toISOString().slice(0, 10),
        members: [
          { id: 'm3', name: 'Meron Tadesse', phone: '+251 92 555 0202' },
          { id: 'm4', name: 'Sintayehu Tesfaye', phone: '+251 92 555 0208' }
        ]
      },
      {
        id: 't3',
        name: 'Team Blue Nile',
        color: '#3A6B94',
        lead: 'Dawit Tesfaye',
        phone: '+251 93 555 0303',
        date: new Date().toISOString().slice(0, 10),
        members: [{ id: 'm5', name: 'Dawit Tesfaye', phone: '+251 93 555 0303' }]
      },
      {
        id: 't4',
        name: 'Team Clay',
        color: '#B65C3E',
        lead: 'Hanna Girma',
        phone: '+251 94 555 0404',
        date: new Date().toISOString().slice(0, 10),
        members: [{ id: 'm6', name: 'Hanna Girma', phone: '+251 94 555 0404' }]
      }
    ],
    brokers: [],
    owners: [],
    properties: [],
    appointments: [],
    followups: [],
    activity: []
  };
}

function normalizeAppointments(data: DatabaseSchema): DatabaseSchema {
  if (!Array.isArray(data.appointments)) {
    data.appointments = [];
  }

  data.appointments = data.appointments.map(appt => ({
    ...appt,
    isShoot: appt.isShoot ?? (appt.kind === 'broker' ? true : false),
    kind: appt.kind ?? 'broker',
    status: appt.status ?? 'Scheduled',
    propId: appt.propId ?? '',
    teamId: appt.teamId ?? ''
  }));

  return data;
}

const SEED_BROKER_IDS = new Set(['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8']);

export function loadDatabase(): DatabaseSchema {
  const seed = getSeedData();
  if (typeof window === 'undefined') return seed;

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      // Pure read: return seed without executing saveDatabase(seed) which wipes remote DB!
      return seed;
    }
    const data = JSON.parse(raw);
    if (!isAppDataShapeCompatible(data)) {
      return seed;
    }

    const normalized = normalizeAppointments(data);

    // Filter out old seed brokers if present
    const cleanBrokers = (normalized.brokers || []).filter(b => !SEED_BROKER_IDS.has(b.id));

    // Ensure all required seed user accounts exist (e.g. admin, manager, team accounts)
    const users = [...(normalized.users || [])];
    seed.users.forEach(su => {
      const idx = users.findIndex(u => u.u === su.u);
      if (idx === -1) {
        users.push(su);
      } else if (su.u === 'manager' && users[idx].name !== 'Akrem Seud') {
        users[idx].name = 'Akrem Seud';
      }
    });

    const finalData: DatabaseSchema = {
      users: users.length ? users : seed.users,
      teams: normalized.teams?.length ? normalized.teams : seed.teams,
      brokers: cleanBrokers,
      owners: normalized.owners || [],
      properties: normalized.properties || [],
      appointments: normalized.appointments || [],
      followups: normalized.followups || [],
      activity: normalized.activity || []
    };

    return finalData;
  } catch (e) {
    console.error('Error loading database from localStorage:', e);
    return seed;
  }
}

export async function loadDatabaseAsync(): Promise<DatabaseSchema> {
  const localData = loadDatabase();

  if (!isSupabaseConfigured()) {
    return localData;
  }

  try {
    const remoteData = await fetchDatabaseFromSupabase();

    if (!remoteData) {
      // Supabase returned null or error — fallback to local cache
      if (localData.brokers.length > 0 || localData.properties.length > 0) {
        saveDatabaseToSupabase(localData);
      }
      return localData;
    }

    const normalized = normalizeAppointments(remoteData);
    const seed = getSeedData();

    // Ensure required seed user accounts always exist in memory/app
    const users = [...(normalized.users || [])];
    seed.users.forEach(su => {
      if (!users.find(u => u.u === su.u)) {
        users.push(su);
      }
    });

    // Remote data takes precedence if populated. If remote is empty but local has data, use local & sync to remote.
    const remoteBrokers = (normalized.brokers || []).filter(b => !SEED_BROKER_IDS.has(b.id));
    const finalBrokers = remoteBrokers.length > 0 ? remoteBrokers : localData.brokers;

    const remoteProps = normalized.properties || [];
    const finalProps = remoteProps.length > 0 ? remoteProps : localData.properties;

    const remoteOwners = normalized.owners || [];
    const finalOwners = remoteOwners.length > 0 ? remoteOwners : localData.owners;

    const syncData: DatabaseSchema = {
      users: users.length ? users : seed.users,
      teams: normalized.teams?.length ? normalized.teams : seed.teams,
      brokers: finalBrokers,
      owners: finalOwners,
      properties: finalProps,
      appointments: (normalized.appointments && normalized.appointments.length > 0) ? normalized.appointments : (localData.appointments || []),
      followups: (normalized.followups && normalized.followups.length > 0) ? normalized.followups : (localData.followups || []),
      activity: (normalized.activity && normalized.activity.length > 0) ? normalized.activity : (localData.activity || [])
    };

    // If local had data that remote didn't have (e.g. newly added offline), push to Supabase
    if (
      (localData.brokers.length > 0 && remoteBrokers.length === 0) ||
      (localData.properties.length > 0 && remoteProps.length === 0)
    ) {
      saveDatabaseToSupabase(syncData);
    }

    // Cache to localStorage for instant hydration on page refresh
    try {
      localStorage.setItem(KEY, JSON.stringify(syncData));
    } catch (_) { /* quota exceeded — non-fatal */ }

    return syncData;
  } catch (e) {
    console.error('Error during database async sync:', e);
    return localData;
  }
}

export function saveDatabase(data: DatabaseSchema) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    if (isSupabaseConfigured()) {
      saveDatabaseToSupabase(data);
    }
  } catch (e) {
    console.error('Failed to save data', e);
  }
}

export function resetDatabase(): DatabaseSchema {
  const seed = getSeedData();
  saveDatabase(seed);
  return seed;
}

export function loadSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveSession(session: Session | null) {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
  } else {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}
