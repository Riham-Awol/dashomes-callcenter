import { createClient } from '@supabase/supabase-js';
import { DatabaseSchema } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
    supabaseAnonKey !== 'your-supabase-anon-key'
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function isCompatibleSupabaseSchema(data: Partial<DatabaseSchema>): boolean {
  if (!data || !Array.isArray(data.users) || !Array.isArray(data.teams) || !Array.isArray(data.appointments)) {
    return false;
  }

  const usersOk = data.users.length === 0 || data.users.some(u => typeof u === 'object' && u !== null && 'u' in u && 'p' in u);
  const appointmentsOk = data.appointments.length === 0 || data.appointments.some(a => typeof a === 'object' && a !== null && 'kind' in a && 'dt' in a);

  return usersOk && appointmentsOk;
}

// Helper to load all application state from Supabase
export async function fetchDatabaseFromSupabase(): Promise<DatabaseSchema | null> {
  if (!supabase) return null;

  try {
    const [
      { data: users },
      { data: teams },
      { data: brokers },
      { data: owners },
      { data: properties },
      { data: appointments },
      { data: followups },
      { data: activity }
    ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('teams').select('*'),
      supabase.from('brokers').select('*'),
      supabase.from('owners').select('*'),
      supabase.from('properties').select('*'),
      supabase.from('appointments').select('*'),
      supabase.from('followups').select('*'),
      supabase.from('activity').select('*')
    ]);

    const remoteData = {
      users: users || [],
      teams: teams || [],
      brokers: brokers || [],
      owners: owners || [],
      properties: properties || [],
      appointments: appointments || [],
      followups: followups || [],
      activity: activity || []
    };

    if (!isCompatibleSupabaseSchema(remoteData)) {
      console.warn('Supabase schema does not match the app data model; falling back to local seed data.');
      return null;
    }

    return remoteData;
  } catch (err) {
    console.error('Failed to fetch from Supabase:', err);
    return null;
  }
}

// Helper to save complete state snapshot to Supabase
export async function saveDatabaseToSupabase(data: DatabaseSchema): Promise<boolean> {
  if (!supabase || !isCompatibleSupabaseSchema(data)) return false;

  try {
    await Promise.all([
      supabase.from('users').upsert(data.users),
      supabase.from('teams').upsert(data.teams),
      supabase.from('brokers').upsert(data.brokers),
      supabase.from('owners').upsert(data.owners),
      supabase.from('properties').upsert(data.properties),
      supabase.from('appointments').upsert(data.appointments),
      supabase.from('followups').upsert(data.followups),
      supabase.from('activity').upsert(data.activity)
    ]);
    return true;
  } catch (err) {
    console.error('Failed to save to Supabase:', err);
    return false;
  }
}
