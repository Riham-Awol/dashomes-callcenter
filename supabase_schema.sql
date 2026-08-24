-- ============================================================
-- DasHomes CallCenter — Supabase Schema
-- Matches the app's TypeScript interfaces exactly.
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Drop existing tables (safe to re-run)
DROP TABLE IF EXISTS activity CASCADE;
DROP TABLE IF EXISTS followups CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS owners CASCADE;
DROP TABLE IF EXISTS brokers CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. Users  (PK = u, the username)
-- App type: { u, p, name, role, teamId? }
-- ============================================================
CREATE TABLE users (
  u     TEXT PRIMARY KEY,
  p     TEXT NOT NULL,
  name  TEXT NOT NULL,
  role  TEXT NOT NULL,
  team_id TEXT
);

-- ============================================================
-- 2. Teams
-- App type: { id, name, color, lead?, phone?, date?, members: TeamMember[] }
-- ============================================================
CREATE TABLE teams (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  color   TEXT NOT NULL,
  lead    TEXT,
  phone   TEXT,
  date    TEXT,
  members JSONB DEFAULT '[]'::jsonb
);

-- ============================================================
-- 3. Brokers
-- App type: { id, name, phone, address?, area?, notes, active, approvalStatus }
-- ============================================================
CREATE TABLE brokers (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  address         TEXT,
  area            TEXT,
  notes           TEXT DEFAULT '',
  active          BOOLEAN DEFAULT true,
  approval_status TEXT DEFAULT 'Pending'
);

-- ============================================================
-- 4. Owners
-- App type: { id, name, phone, notes }
-- ============================================================
CREATE TABLE owners (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT DEFAULT ''
);

-- ============================================================
-- 5. Properties
-- ============================================================
CREATE TABLE properties (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  owner            TEXT NOT NULL,
  phone            TEXT NOT NULL,
  broker_id        TEXT,
  type             TEXT NOT NULL,
  custom_type      TEXT,
  floors           TEXT,
  bedrooms         INTEGER DEFAULT 0,
  bathrooms        INTEGER,
  listing          TEXT NOT NULL DEFAULT 'sale',
  lease_duration   TEXT,
  min_rent         TEXT,
  furnished        BOOLEAN DEFAULT false,
  sqm              INTEGER DEFAULT 0,
  address          TEXT NOT NULL DEFAULT '',
  unit_floor       TEXT,
  amenities        TEXT DEFAULT '',
  price            INTEGER DEFAULT 0,
  fee              INTEGER DEFAULT 0,
  deposit          INTEGER DEFAULT 0,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  notes            TEXT DEFAULT '',
  photo            TEXT,
  photos           JSONB DEFAULT '[]'::jsonb,
  remarks          TEXT,
  approval_status  TEXT DEFAULT 'Pending',
  assigned_team_id TEXT
);

-- ============================================================
-- 6. Appointments
-- ============================================================
CREATE TABLE appointments (
  id                        TEXT PRIMARY KEY,
  dt                        TEXT NOT NULL,
  kind                      TEXT NOT NULL,
  contact_id                TEXT DEFAULT '',
  name                      TEXT NOT NULL DEFAULT '',
  phone                     TEXT NOT NULL DEFAULT '',
  prop_id                   TEXT DEFAULT '',
  address                   TEXT DEFAULT '',
  team_id                   TEXT DEFAULT '',
  status                    TEXT NOT NULL DEFAULT 'Scheduled',
  notes                     TEXT DEFAULT '',
  lat                       DOUBLE PRECISION,
  lng                       DOUBLE PRECISION,
  is_shoot                  BOOLEAN DEFAULT false,
  incompletion_reason       TEXT,
  completed_by_members      JSONB DEFAULT '[]'::jsonb,
  assigned_members_snapshot JSONB DEFAULT '[]'::jsonb
);

-- ============================================================
-- 7. Follow-ups
-- ============================================================
CREATE TABLE followups (
  id       TEXT PRIMARY KEY,
  doc      TEXT NOT NULL DEFAULT '',
  name     TEXT NOT NULL DEFAULT '',
  phone    TEXT NOT NULL DEFAULT '',
  property TEXT DEFAULT '',
  status   TEXT NOT NULL DEFAULT 'New lead',
  next     TEXT DEFAULT '',
  action   TEXT DEFAULT '',
  priority TEXT DEFAULT 'Normal'
);

-- ============================================================
-- 8. Activity
-- ============================================================
CREATE TABLE activity (
  id   TEXT PRIMARY KEY,
  ts   BIGINT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  type TEXT
);

-- ============================================================
-- Row Level Security — allow full access via anon key (demo app)
-- ============================================================
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners       ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties   ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups    ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON users        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON teams        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON brokers      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON owners       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON properties   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON followups    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON activity     FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Seed Data: Demo Users
-- ============================================================
INSERT INTO users (u, p, name, role, team_id) VALUES
  ('admin',   'dashomes', 'Akrem Seud',          'System Administrator',        NULL),
  ('manager', 'dashomes', 'Akrem Seud',          'Property & Broker Manager',   NULL),
  ('agent',   'dashomes', 'Front Desk Operator', 'Call Center Operator',         NULL),
  ('team1',   'dashomes', 'Team Falcon',         'Team Member (Field Agent)',    't1'),
  ('team2',   'dashomes', 'Team Sheba',          'Team Member (Field Agent)',    't2'),
  ('team3',   'dashomes', 'Team Blue Nile',      'Team Member (Field Agent)',    't3'),
  ('team4',   'dashomes', 'Team Clay',           'Team Member (Field Agent)',    't4');

-- Seed Data: Demo Teams
INSERT INTO teams (id, name, color, lead, phone, date, members) VALUES
  ('t1', 'Team Falcon',    '#2E4632', 'Yonas Alemu',    '+251 91 555 0101', CURRENT_DATE::TEXT, '[{"id":"m1","name":"Yonas Alemu","phone":"+251 91 555 0101"},{"id":"m2","name":"Kassahun Bekele","phone":"+251 91 555 0109"}]'::jsonb),
  ('t2', 'Team Sheba',     '#B8862B', 'Meron Tadesse',  '+251 92 555 0202', CURRENT_DATE::TEXT, '[{"id":"m3","name":"Meron Tadesse","phone":"+251 92 555 0202"},{"id":"m4","name":"Sintayehu Tesfaye","phone":"+251 92 555 0208"}]'::jsonb),
  ('t3', 'Team Blue Nile', '#3A6B94', 'Dawit Tesfaye',  '+251 93 555 0303', CURRENT_DATE::TEXT, '[{"id":"m5","name":"Dawit Tesfaye","phone":"+251 93 555 0303"}]'::jsonb),
  ('t4', 'Team Clay',      '#B65C3E', 'Hanna Girma',    '+251 94 555 0404', CURRENT_DATE::TEXT, '[{"id":"m6","name":"Hanna Girma","phone":"+251 94 555 0404"}]'::jsonb);

-- Seed Data: Demo Owners
INSERT INTO owners (id, name, phone, notes) VALUES
  ('o1', 'Ato Kebede',           '+251 91 234 5678', 'Summit Residential — prefers calls after 4 PM'),
  ('o2', 'W/ro Almaz Tesfaye',   '+251 92 987 6543', 'Megenagna Corner; negotiating terms'),
  ('o3', 'Ato Tadesse Worku',    '+251 91 445 2211', 'Bole Vista townhouses'),
  ('o4', 'W/ro Selam Girma',     '+251 93 812 3490', 'Kazanchis Plaza owner'),
  ('o5', 'Ato Dawit Bekele',     '+251 94 660 1287', 'CMC Michael Park developer rep');
