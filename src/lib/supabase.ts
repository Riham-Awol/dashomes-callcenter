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

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
  if (!supabase) return null;

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
      supabase.from('users').select('*'),
      supabase.from('teams').select('*'),
      supabase.from('brokers').select('*'),
      supabase.from('owners').select('*'),
      supabase.from('properties').select('*'),
      supabase.from('appointments').select('*'),
      supabase.from('followups').select('*'),
      supabase.from('activity').select('*')
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
      activity: (activity || []).map((r: any) => {
        // Activity rows have a synthetic `id` column in DB — strip it for the app
        const mapped = rowToCamel(r);
        delete mapped.id;
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
  if (!supabase) return false;

  try {
    // Map camelCase app objects → snake_case DB rows
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

    // ── Upsert all tables in parallel ──
    const results = await Promise.all([
      upsertTable(supabase, 'users', usersRows, 'u', data.users.map(u => u.u)),
      upsertTable(supabase, 'teams', teamsRows, 'id', data.teams.map(t => t.id)),
      upsertTable(supabase, 'brokers', brokersRows, 'id', data.brokers.map(b => b.id)),
      upsertTable(supabase, 'owners', ownersRows, 'id', data.owners.map(o => o.id)),
      upsertTable(supabase, 'properties', propsRows, 'id', data.properties.map(p => p.id)),
      upsertTable(supabase, 'appointments', apptsRows, 'id', data.appointments.map(a => a.id)),
      upsertTable(supabase, 'followups', fuRows, 'id', data.followups.map(f => f.id)),
      replaceActivity(supabase, actRows)
    ]);

    const hasErrors = results.some(r => r === false);
    if (hasErrors) {
      console.warn('Some Supabase upserts had errors (see above).');
    }
    return !hasErrors;
  } catch (err) {
    console.error('Failed to save to Supabase:', err);
    return false;
  }
}

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Upsert rows into a table, then delete any rows whose PK is not in currentIds.
 * This handles adds, updates, AND deletes.
 */
async function upsertTable(
  sb: SupabaseClient,
  table: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: Record<string, any>[],
  pkColumn: string,
  currentIds: string[]
): Promise<boolean> {
  try {
    // Upsert current rows
    if (rows.length > 0) {
      const { error: upsertErr } = await sb.from(table).upsert(rows, { onConflict: pkColumn });
      if (upsertErr) {
        console.error(`Supabase upsert error on ${table}:`, upsertErr);
        return false;
      }
    }

    // Delete rows that no longer exist in the app state
    if (currentIds.length > 0) {
      const { error: delErr } = await sb
        .from(table)
        .delete()
        .not(pkColumn, 'in', `(${currentIds.map(id => `"${id.replace(/"/g, '\\"')}"`).join(',')})`);
      if (delErr) {
        console.error(`Supabase delete-stale error on ${table}:`, delErr);
      }
    } else {
      // If no current rows, delete everything
      const { error: delErr } = await sb.from(table).delete().neq(pkColumn, '___impossible___');
      if (delErr) {
        console.error(`Supabase delete-all error on ${table}:`, delErr);
      }
    }
    return true;
  } catch (e) {
    console.error(`Supabase upsertTable error on ${table}:`, e);
    return false;
  }
}

/**
 * Replace all activity rows (delete all, then insert fresh).
 */
async function replaceActivity(
  sb: SupabaseClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: Record<string, any>[]
): Promise<boolean> {
  try {
    // Delete all existing activity
    await sb.from('activity').delete().neq('id', '___impossible___');

    // Insert fresh
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
