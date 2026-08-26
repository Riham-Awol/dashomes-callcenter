import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseSchema, Activity } from '@/types';

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

// ─── Singleton Supabase client (avoids multiple GoTrueClient instances) ──
let _supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!_supabaseInstance) {
    _supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabaseInstance;
}

// Backward-compat export
export const supabase = getSupabase();

// ─── Snake ↔ Camel case converters ────────────────────────────
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSnake(obj: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    out[camelToSnake(key)] = obj[key];
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCamel(obj: any): any {
  const out: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    out[snakeToCamel(key)] = obj[key];
  }
  return out;
}

// ─── Fetch all tables from Supabase ───────────────────────────
export async function fetchDatabaseFromSupabase(): Promise<DatabaseSchema | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const [
      { data: users, error: e1 },
      { data: teams, error: e2 },
      { data: brokers, error: e3 },
      { data: owners, error: e4 },
      { data: properties, error: e5 },
      { data: appointments, error: e6 },
      { data: followups, error: e7 },
      { data: activity, error: e8 }
    ] = await Promise.all([
      sb.from('users').select('*'),
      sb.from('teams').select('*'),
      sb.from('brokers').select('*'),
      sb.from('owners').select('*'),
      sb.from('properties').select('*'),
      sb.from('appointments').select('*'),
      sb.from('followups').select('*'),
      sb.from('activity').select('*')
    ]);

    const errors = [e1, e2, e3, e4, e5, e6, e7, e8].filter(Boolean);
    if (errors.length > 0) {
      console.error('Supabase fetch errors:', errors);
      return null;
    }

    // Map snake_case DB rows → camelCase app objects
    return {
      users: (users || []).map(rowToCamel),
      teams: (teams || []).map(rowToCamel),
      brokers: (brokers || []).map(rowToCamel),
      owners: (owners || []).map(rowToCamel),
      properties: (properties || []).map(rowToCamel),
      appointments: (appointments || []).map(rowToCamel),
      followups: (followups || []).map(rowToCamel),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activity: (activity || []).map((r: any) => {
        const mapped = rowToCamel(r);
        delete mapped.id; // strip synthetic DB id
        return mapped;
      })
    } as DatabaseSchema;
  } catch (err) {
    console.error('Failed to fetch from Supabase:', err);
    return null;
  }
}

// ─── Save complete state snapshot to Supabase ─────────────────
export async function saveDatabaseToSupabase(data: DatabaseSchema): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const usersRows = data.users.map(rowToSnake);
    const teamsRows = data.teams.map(rowToSnake);
    const brokersRows = data.brokers.map(rowToSnake);
    const ownersRows = data.owners.map(rowToSnake);
    const propsRows = data.properties.map(rowToSnake);
    const apptsRows = data.appointments.map(rowToSnake);
    const fuRows = data.followups.map(rowToSnake);

    // Activity — generate synthetic id for PK since app type has none
    const actRows = data.activity.map((a: Activity, i: number) => ({
      id: `act_${a.ts}_${i}`,
      ts: a.ts,
      text: a.text,
      type: a.type || null
    }));

    const results = await Promise.all([
      upsertTable(sb, 'users', usersRows, 'u', data.users.map(u => u.u)),
      upsertTable(sb, 'teams', teamsRows, 'id', data.teams.map(t => t.id)),
      upsertTable(sb, 'brokers', brokersRows, 'id', data.brokers.map(b => b.id)),
      upsertTable(sb, 'owners', ownersRows, 'id', data.owners.map(o => o.id)),
      upsertTable(sb, 'properties', propsRows, 'id', data.properties.map(p => p.id)),
      upsertTable(sb, 'appointments', apptsRows, 'id', data.appointments.map(a => a.id)),
      upsertTable(sb, 'followups', fuRows, 'id', data.followups.map(f => f.id)),
      replaceActivity(sb, actRows)
    ]);

    const hasErrors = results.some(r => r === false);
    if (hasErrors) {
      console.warn('Some Supabase upserts had errors (see console).');
    }
    return !hasErrors;
  } catch (err) {
    console.error('Failed to save to Supabase:', err);
    return false;
  }
}

export async function deleteRecordFromSupabase(table: string, pkColumn: string, id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from(table).delete().eq(pkColumn, id);
    if (error) console.error(`Failed to delete record ${id} from ${table}:`, error);
    return !error;
  } catch (e) {
    console.error(`Error deleting from ${table}:`, e);
    return false;
  }
}

// Primary-key column for each syncable table
const TABLE_PK: Record<string, string> = {
  users: 'u',
  teams: 'id',
  brokers: 'id',
  owners: 'id',
  properties: 'id',
  appointments: 'id',
  followups: 'id'
};

// ─── Propagate deletions to Supabase ──────────────────────────
// Compares the previous vs. next app state and deletes, from Supabase, exactly
// the rows the user removed. This is precise (never touches other rows) and
// guarantees a delete persists — so a deleted record can't reappear after the
// next background sync / page refresh.
export async function syncDeletionsToSupabase(
  prev: DatabaseSchema,
  next: DatabaseSchema
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  for (const table of Object.keys(TABLE_PK)) {
    const pk = TABLE_PK[table];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevRows: any[] = (prev as any)[table] || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextRows: any[] = (next as any)[table] || [];
    const nextIds = new Set(nextRows.map(r => r[pk]));
    const removed = prevRows.filter(r => r[pk] != null && !nextIds.has(r[pk]));
    for (const r of removed) {
      await deleteRecordFromSupabase(table, pk, r[pk]);
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────

async function upsertTable(
  sb: SupabaseClient,
  table: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: Record<string, any>[],
  pkColumn: string,
  currentIds: string[]
): Promise<boolean> {
  try {
    if (rows.length > 0) {
      const { error: upsertErr } = await sb.from(table).upsert(rows, { onConflict: pkColumn });
      if (upsertErr) {
        console.error(`Supabase upsert error on ${table}:`, upsertErr);
        return false;
      }

      // Delete stale rows that were removed from app state, but ONLY if we have an active dataset
      if (currentIds.length > 0) {
        const { error: delErr } = await sb
          .from(table)
          .delete()
          .not(pkColumn, 'in', `(${currentIds.map(id => `"${id.replace(/"/g, '\\"')}"`).join(',')})`);
        if (delErr) {
          console.error(`Supabase delete-stale error on ${table}:`, delErr);
        }
      }
    }
    // Safety: If rows is empty ([]), do NOT execute mass DELETE ALL on Supabase.
    // Empty state should never wipe remote database automatically.
    return true;
  } catch (e) {
    console.error(`Supabase upsertTable error on ${table}:`, e);
    return false;
  }
}

async function replaceActivity(
  sb: SupabaseClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: Record<string, any>[]
): Promise<boolean> {
  try {
    await sb.from('activity').delete().neq('id', '___impossible___');
    if (rows.length > 0) {
      const { error } = await sb.from('activity').insert(rows);
      if (error) {
        console.error('Supabase activity insert error:', error);
        return false;
      }
    }
    return true;
  } catch (e) {
    console.error('Supabase replaceActivity error:', e);
    return false;
  }
}
