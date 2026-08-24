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
    owners: [
      { id: 'o1', name: 'Ato Kebede', phone: '+251 91 234 5678', notes: 'Summit Residential — prefers calls after 4 PM' },
      { id: 'o2', name: 'W/ro Almaz Tesfaye', phone: '+251 92 987 6543', notes: 'Megenagna Corner; negotiating terms' },
      { id: 'o3', name: 'Ato Tadesse Worku', phone: '+251 91 445 2211', notes: 'Bole Vista townhouses' },
      { id: 'o4', name: 'W/ro Selam Girma', phone: '+251 93 812 3490', notes: 'Kazanchis Plaza owner' },
      { id: 'o5', name: 'Ato Dawit Bekele', phone: '+251 94 660 1287', notes: 'CMC Michael Park developer rep' }
    ],
    properties: [
      {
        id: 'p1',
        name: 'Summit Residential — 4B',
        owner: 'Ato Kebede',
        phone: '+251 91 234 5678',
        brokerId: '',
        type: 'Apartment',
        floors: '',
        bedrooms: 3,
        listing: 'rent',
        leaseDuration: '12 months',
        minRent: 12,
        furnished: true,
        sqm: 140,
        address: 'Summit, near Betel Church',
        unitFloor: '4',
        amenities: 'Backup generator, Water reserve, Elevator, Gym, Parking',
        price: 85000,
        fee: 8500,
        deposit: 170000,
        lat: 8.9990,
        lng: 38.8230,
        notes: 'Bright corner unit; owner flexible on 12–24 mo terms.',
        photo: null,
        approvalStatus: 'Approved'
      },
      {
        id: 'p2',
        name: 'Bole Vista Townhouse 7',
        owner: 'Ato Tadesse Worku',
        phone: '+251 91 445 2211',
        brokerId: '',
        type: 'Townhouse',
        floors: 'G+2',
        bedrooms: 5,
        listing: 'sale',
        minRent: '',
        furnished: false,
        sqm: 420,
        address: 'Bole Vista, Street 3',
        unitFloor: '',
        amenities: 'Garden, Garage, Solar, CCTV',
        price: 38500000,
        fee: 0,
        deposit: 0,
        lat: 9.0080,
        lng: 38.8050,
        notes: '',
        photo: null,
        approvalStatus: 'Approved'
      },
      {
        id: 'p3',
        name: 'Kazanchis Plaza 2A',
        owner: 'W/ro Selam Girma',
        phone: '+251 93 812 3490',
        brokerId: '',
        type: 'Apartment',
        floors: '',
        bedrooms: 2,
        listing: 'rent',
        leaseDuration: '6 months',
        minRent: 6,
        furnished: false,
        sqm: 95,
        address: 'Kazanchis, behind Total station',
        unitFloor: '2',
        amenities: 'Elevator, Parking, Backup power',
        price: 42000,
        fee: 3000,
        deposit: 84000,
        lat: 9.0150,
        lng: 38.7610,
        notes: '',
        photo: null,
        approvalStatus: 'Approved'
      },
      {
        id: 'p4',
        name: 'CMC Michael Park Villa 12',
        owner: 'Ato Dawit Bekele',
        phone: '+251 94 660 1287',
        type: 'Villa',
        floors: 'G+1',
        bedrooms: 4,
        listing: 'sale',
        minRent: '',
        furnished: true,
        sqm: 350,
        address: 'CMC Michael Park, cluster B',
        unitFloor: '',
        amenities: 'Pool, Garden, Guard house',
        price: 29900000,
        fee: 0,
        deposit: 0,
        lat: 9.0135,
        lng: 38.8345,
        notes: 'Show-unit furniture included.',
        photo: null,
        approvalStatus: 'Approved'
      },
      {
        id: 'p5',
        name: 'Sarbet Sunflower 9C',
        owner: 'W/ro Almaz Tesfaye',
        phone: '+251 92 987 6543',
        type: 'Apartment',
        floors: '',
        bedrooms: 1,
        listing: 'rent',
        leaseDuration: '12 months',
        minRent: 3,
        furnished: true,
        sqm: 60,
        address: 'Sarbet, Sunflower Tower',
        unitFloor: '9',
        amenities: 'Elevator, Gym, Fiber internet',
        price: 30000,
        fee: 2500,
        deposit: 60000,
        lat: 8.9910,
        lng: 38.7430,
        notes: '',
        photo: null,
        approvalStatus: 'Approved'
      },
      {
        id: 'p6',
        name: 'Ayat Grand Villa 22',
        owner: 'Ato Fikru Alemu',
        phone: '+251 91 777 8899',
        type: 'Villa',
        floors: 'G+2',
        bedrooms: 6,
        listing: 'sale',
        minRent: '',
        furnished: false,
        sqm: 520,
        address: 'Ayat Real Estate, Zone 2',
        unitFloor: '',
        amenities: 'Pool, Staff quarters, Solar, Borehole',
        price: 55000000,
        fee: 0,
        deposit: 0,
        lat: 9.0300,
        lng: 38.8600,
        notes: 'Price negotiable for cash buyers.',
        photo: null,
        approvalStatus: 'Approved'
      }
    ],
    appointments: [
      { id: 'a1', dt: dtOff(0, '10:00'), kind: 'broker', contactId: 'b1', name: 'Samuel Bekele', phone: '+251 91 123 4567', propId: '', address: 'Bole Near Olympia, Apartment 4B', teamId: 't1', status: 'Confirmed', notes: 'Key will be picked up at the gate; 3-bedroom unit.', lat: 9.0054, lng: 38.7700, isShoot: true },
      { id: 'a2', dt: dtOff(0, '14:30'), kind: 'owner', contactId: 'o1', name: 'Ato Kebede', phone: '+251 91 234 5678', propId: 'p1', address: 'Summit Residential, Block C', teamId: 't2', status: 'Scheduled', notes: 'Owner wants courtyard shots too.', lat: 8.9990, lng: 38.8230, isShoot: false },
      { id: 'a3', dt: dtOff(0, '16:15'), kind: 'broker', contactId: 'b2', name: 'Ruth Alemu', phone: '+251 92 456 7890', propId: '', address: 'Kazanchis Plaza, 7th floor', teamId: 't3', status: 'Confirmed', notes: 'Property intake and lifestyle photo set for listing rollout.', lat: 9.0150, lng: 38.7610, isShoot: true },
      { id: 'a4', dt: dtOff(1, '09:30'), kind: 'broker', contactId: 'b3', name: 'Bereket Tadesse', phone: '+251 91 888 2233', propId: 'p4', address: 'CMC Michael Park, Villa 12', teamId: 't1', status: 'Scheduled', notes: 'Gated community — call guard first.', lat: 9.0135, lng: 38.8345, isShoot: true },
      { id: 'a5', dt: dtOff(1, '11:00'), kind: 'owner', contactId: 'o2', name: 'W/ro Almaz Tesfaye', phone: '+251 92 987 6543', propId: '', address: 'Megenagna Corner, Apt 2A', teamId: 't4', status: 'Scheduled', notes: 'Owner walkthrough and floor plan review.', lat: 9.0209, lng: 38.8010, isShoot: false },
      { id: 'a6', dt: dtOff(2, '13:00'), kind: 'owner', contactId: 'o3', name: 'Ato Tadesse Worku', phone: '+251 91 445 2211', propId: 'p2', address: 'Bole Vista Townhouse 7', teamId: 't1', status: 'Scheduled', notes: 'Bring drone.', lat: 9.0080, lng: 38.8050, isShoot: false },
      { id: 'a7', dt: dtOff(3, '10:30'), kind: 'broker', contactId: 'b6', name: 'Natnael Fikre', phone: '+251 91 605 3312', propId: 'p6', address: 'Ayat Real Estate, Villa 22', teamId: 't4', status: 'Scheduled', notes: 'Exterior-wide angle and interior lifestyle shoot.', lat: 9.0300, lng: 38.8600, isShoot: true },
      { id: 'a8', dt: dtOff(-1, '10:00'), kind: 'broker', contactId: 'b4', name: 'Sara Mekonnen', phone: '+251 93 771 4455', propId: '', address: 'Piassa Heritage Row, Office 3', teamId: 't2', status: 'Completed', notes: 'Delivered 34 photos.', lat: 9.0350, lng: 38.7500, isShoot: true },
      { id: 'a9', dt: dtOff(-1, '15:00'), kind: 'broker', contactId: 'b5', name: 'Lidiya Girma', phone: '+251 94 220 9081', propId: 'p5', address: 'Sarbet Sunflower, Apt 9C', teamId: 't3', status: 'Completed', notes: 'Final listing photos delivered.', lat: 8.9910, lng: 38.7430, isShoot: true },
      { id: 'a10', dt: dtOff(-3, '10:00'), kind: 'broker', contactId: 'b1', name: 'Samuel Bekele', phone: '+251 91 123 4567', propId: '', address: 'Gerji Imperial, Apt 5F', teamId: 't1', status: 'Completed', notes: 'Completed exterior and staircase stills.', lat: 8.9880, lng: 38.7900, isShoot: true },
      { id: 'a11', dt: dtOff(-1, '09:00'), kind: 'broker', contactId: 'b7', name: 'Eyob Haile', phone: '+251 92 118 0094', propId: '', address: 'Kality Warehouse District', teamId: 't3', status: 'Cancelled', notes: 'Broker unreachable.', lat: 8.9170, lng: 38.7980, isShoot: false }
    ],
    followups: [
      { id: 'f1', doc: dOff(-4), name: 'Ato Kebede', phone: '+251 91 234 5678', property: 'Summit Residential', status: 'Waiting for manager approval', next: dOff(3), action: 'Confirm pricing with Head of Sales' },
      { id: 'f2', doc: dOff(-6), name: 'W/ro Almaz Tesfaye', phone: '+251 92 987 6543', property: 'Megenagna Corner Complex', status: 'Negotiating', next: dOff(-1), action: 'Call back with revised commission — Manager Hanna' },
      { id: 'f3', doc: dOff(-1), name: 'Ato Tadesse Worku', phone: '+251 91 445 2211', property: 'Bole Vista Townhouses', status: 'Documents pending', next: dOff(0), action: 'Collect title deed copy before shoot' },
      { id: 'f4', doc: dOff(-9), name: 'W/ro Selam Girma', phone: '+251 93 812 3490', property: 'Kazanchis Plaza', status: 'New lead', next: dOff(-2), action: 'Schedule site visit with Team Blue Nile' },
      { id: 'f5', doc: dOff(-2), name: 'Ato Fikru Alemu', phone: '+251 91 777 8899', property: 'Ayat Grand Villas', status: 'Closed - Won', next: '', action: 'Handed over to photography team' },
      { id: 'f6', doc: dOff(-3), name: 'Ato Dawit Bekele', phone: '+251 94 660 1287', property: 'CMC Michael Park', status: 'Meeting scheduled', next: dOff(1), action: 'Prepare listing agreement' }
    ],
    activity: [
      { ts: Date.now() - 3600e3, text: 'Team Falcon confirmed the 10:00 AM Bole shoot with Samuel Bekele.' },
      { ts: Date.now() - 7200e3, text: 'New property registered: Ayat Grand Villa 22 (sale).' },
      { ts: Date.now() - 26e6, text: 'Follow-up logged with Ato Dawit Bekele — meeting scheduled.' },
      { ts: Date.now() - 50e6, text: 'Broker Hanna Solomon registered and marked active.' }
    ]
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
      saveDatabase(seed);
      return seed;
    }
    const data = JSON.parse(raw);
    if (!isAppDataShapeCompatible(data)) {
      saveDatabase(seed);
      return seed;
    }

    const normalized = normalizeAppointments(data);

    const hasEmptySeedState = normalized.teams.length === 0 || normalized.users.length === 0 || normalized.appointments.length === 0;
    const baseData = hasEmptySeedState ? seed : normalized;

    // Filter out old seed brokers
    baseData.brokers = (baseData.brokers || []).filter(b => !SEED_BROKER_IDS.has(b.id));

    // Auto-merge missing seed user accounts (e.g. team1, team2, team3, team4, manager Akrem Seud)
    let updated = false;
    seed.users.forEach(su => {
      const idx = baseData.users.findIndex(u => u.u === su.u);
      if (idx === -1) {
        baseData.users.push(su);
        updated = true;
      } else if (su.u === 'manager' && baseData.users[idx].name !== 'Akrem Seud') {
        baseData.users[idx].name = 'Akrem Seud';
        updated = true;
      }
    });

    const finalData = {
      ...baseData,
      appointments: baseData.appointments.length ? baseData.appointments : seed.appointments,
      teams: baseData.teams.length ? baseData.teams : seed.teams,
      users: baseData.users.length ? baseData.users : seed.users,
      brokers: baseData.brokers || [],
      owners: baseData.owners.length ? baseData.owners : seed.owners,
      properties: baseData.properties.length ? baseData.properties : seed.properties,
      followups: baseData.followups.length ? baseData.followups : seed.followups,
      activity: baseData.activity.length ? baseData.activity : seed.activity
    };
    localStorage.setItem(KEY, JSON.stringify(finalData));
    return finalData;
  } catch (e) {
    saveDatabase(seed);
    return seed;
  }
}

export async function loadDatabaseAsync(): Promise<DatabaseSchema> {
  if (isSupabaseConfigured()) {
    let remoteData = await fetchDatabaseFromSupabase();
    const seed = getSeedData();

    if (!remoteData || remoteData.users.length === 0 || remoteData.teams.length === 0 || remoteData.appointments.length === 0) {
      // Auto-seed Supabase Cloud database with default accounts and initial records
      const hydrated = {
        ...seed,
        ...remoteData,
        users: remoteData?.users?.length ? remoteData.users : seed.users,
        teams: remoteData?.teams?.length ? remoteData.teams : seed.teams,
        brokers: (remoteData?.brokers || []).filter(b => !SEED_BROKER_IDS.has(b.id)),
        owners: remoteData?.owners?.length ? remoteData.owners : seed.owners,
        properties: remoteData?.properties?.length ? remoteData.properties : seed.properties,
        appointments: remoteData?.appointments?.length ? remoteData.appointments : seed.appointments,
        followups: remoteData?.followups?.length ? remoteData.followups : seed.followups,
        activity: remoteData?.activity?.length ? remoteData.activity : seed.activity
      };
      await saveDatabaseToSupabase(hydrated);
      remoteData = hydrated;
    } else {
      remoteData = normalizeAppointments(remoteData);
      remoteData.brokers = (remoteData.brokers || []).filter(b => !SEED_BROKER_IDS.has(b.id));
      // Ensure all seed accounts exist in remoteData
      let seedUpdated = false;
      seed.users.forEach(su => {
        if (!remoteData!.users.some(u => u.u === su.u)) {
          remoteData!.users.push(su);
          seedUpdated = true;
        }
      });
      await saveDatabaseToSupabase(remoteData);
    }

    saveDatabase(remoteData);
    return remoteData;
  }
  return loadDatabase();
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
