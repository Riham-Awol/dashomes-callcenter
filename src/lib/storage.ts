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
    brokers: [
      { id: 'b1', name: 'Samuel Bekele', phone: '+251 91 123 4567', address: 'Bole Road', area: 'Bole Atlas', notes: 'High-volume Bole broker; prefers morning shoots', active: true, approvalStatus: 'Approved' },
      { id: 'b2', name: 'Ruth Alemu', phone: '+251 92 456 7890', address: 'Kazanchis Total', area: 'Kazanchis', notes: 'Kazanchis & Piassa specialist', active: true, approvalStatus: 'Approved' },
      { id: 'b3', name: 'Bereket Tadesse', phone: '+251 91 888 2233', address: 'CMC Roundabout', area: 'CMC', notes: 'Works the CMC / Ayat corridor', active: true, approvalStatus: 'Approved' },
      { id: 'b4', name: 'Sara Mekonnen', phone: '+251 93 771 4455', address: 'Piassa Row', area: 'Piassa', notes: 'Responds fast on Telegram', active: true, approvalStatus: 'Approved' },
      { id: 'b5', name: 'Lidiya Girma', phone: '+251 94 220 9081', address: 'Sarbet Sunflower', area: 'Sarbet', notes: 'Sarbet area listings', active: true, approvalStatus: 'Approved' },
      { id: 'b6', name: 'Natnael Fikre', phone: '+251 91 605 3312', address: 'Ayat Zone 2', area: 'Ayat', notes: '', active: true, approvalStatus: 'Approved' },
      { id: 'b7', name: 'Eyob Haile', phone: '+251 92 118 0094', address: 'Kality', area: 'Kality', notes: 'Inactive since July — changed brokerage', active: false, approvalStatus: 'Rejected' },
      { id: 'b8', name: 'Hanna Solomon', phone: '+251 96 340 7788', address: 'Gotera', area: 'Gotera', notes: 'New partner — onboarded last week', active: true, approvalStatus: 'Pending' }
    ],
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
        brokerId: 'b1',
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
        brokerId: 'b1',
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
        brokerId: 'b2',
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

export function loadDatabase(): DatabaseSchema {
  if (typeof window === 'undefined') return getSeedData();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return getSeedData();
    const data: DatabaseSchema = JSON.parse(raw);
    if (!data || !data.teams) return getSeedData();

    const normalized = normalizeAppointments(data);

    // Auto-merge missing seed user accounts (e.g. team1, team2, team3, team4, manager Akrem Seud)
    const seed = getSeedData();
    let updated = false;
    seed.users.forEach(su => {
      const idx = normalized.users.findIndex(u => u.u === su.u);
      if (idx === -1) {
        normalized.users.push(su);
        updated = true;
      } else if (su.u === 'manager' && normalized.users[idx].name !== 'Akrem Seud') {
        normalized.users[idx].name = 'Akrem Seud';
        updated = true;
      }
    });

    if (updated || normalized.appointments.some(a => a.isShoot === undefined)) {
      localStorage.setItem(KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch (e) {
    return getSeedData();
  }
}

export async function loadDatabaseAsync(): Promise<DatabaseSchema> {
  if (isSupabaseConfigured()) {
    let remoteData = await fetchDatabaseFromSupabase();
    const seed = getSeedData();

    if (!remoteData || remoteData.users.length === 0) {
      // Auto-seed Supabase Cloud database with default accounts and initial records
      await saveDatabaseToSupabase(seed);
      remoteData = seed;
    } else {
      remoteData = normalizeAppointments(remoteData);
      // Ensure all seed accounts exist in remoteData
      let seedUpdated = false;
      seed.users.forEach(su => {
        if (!remoteData!.users.some(u => u.u === su.u)) {
          remoteData!.users.push(su);
          seedUpdated = true;
        }
      });
      if (seedUpdated || remoteData.appointments.some(a => a.isShoot === undefined)) {
        await saveDatabaseToSupabase(remoteData);
      }
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
