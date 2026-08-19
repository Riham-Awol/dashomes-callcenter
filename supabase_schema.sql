-- Supabase Schema for DasHomes Call Center

-- 1. Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    teamId TEXT,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Teams Table
CREATE TABLE teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    leader TEXT,
    members TEXT[], -- Array of strings (broker IDs)
    target INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Brokers Table
CREATE TABLE brokers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    teamId TEXT NOT NULL,
    status TEXT NOT NULL, -- 'Active' | 'Busy' | 'Offline'
    rating NUMERIC,
    active_deals INTEGER,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Owners Table
CREATE TABLE owners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Developer' | 'Private' | 'Agency'
    rating NUMERIC,
    properties INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Properties Table
CREATE TABLE properties (
    id TEXT PRIMARY KEY,
    ownerId TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    price INTEGER NOT NULL,
    location TEXT NOT NULL,
    lat NUMERIC,
    lng NUMERIC,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area INTEGER,
    furnished BOOLEAN,
    amenities TEXT[],
    photos TEXT[],
    listedDate TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Appointments Table
CREATE TABLE appointments (
    id TEXT PRIMARY KEY,
    clientId TEXT NOT NULL,
    clientName TEXT NOT NULL,
    clientPhone TEXT NOT NULL,
    propertyId TEXT,
    brokerId TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. FollowUps Table
CREATE TABLE followups (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    targetId TEXT NOT NULL,
    targetName TEXT NOT NULL,
    agentId TEXT NOT NULL,
    dueDate TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    priority TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Activity Table
CREATE TABLE activity (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    userName TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Demo Users
INSERT INTO users (id, username, password, name, role, teamId, avatar) VALUES
('u1', 'admin', 'dashomes', 'Selamawit D.', 'Call Center Manager', NULL, 'https://i.pravatar.cc/150?u=admin'),
('u2', 'agent', 'dashomes', 'Front Desk', 'Operator', 'team_alpha', 'https://i.pravatar.cc/150?u=agent');

-- Insert Demo Teams
INSERT INTO teams (id, name, color, leader, members, target) VALUES
('team_alpha', 'Bole Elite', '#3b82f6', 'Dawit M.', ARRAY['b1', 'b2', 'b5'], 15),
('team_beta', 'CMC Specialists', '#10b981', 'Sara T.', ARRAY['b3', 'b4'], 12),
('team_gamma', 'Luxury Villas', '#8b5cf6', 'Mikias A.', ARRAY['b6'], 8);

-- Insert Demo Brokers
INSERT INTO brokers (id, name, phone, teamId, status, rating, active_deals, avatar) VALUES
('b1', 'Dawit M.', '+251 911 234567', 'team_alpha', 'Active', 4.8, 3, 'https://i.pravatar.cc/150?u=b1'),
('b2', 'Sara T.', '+251 922 345678', 'team_beta', 'Busy', 4.9, 5, 'https://i.pravatar.cc/150?u=b2'),
('b3', 'Yosef K.', '+251 933 456789', 'team_beta', 'Offline', 4.5, 1, 'https://i.pravatar.cc/150?u=b3'),
('b4', 'Beti A.', '+251 944 567890', 'team_beta', 'Active', 4.7, 2, 'https://i.pravatar.cc/150?u=b4'),
('b5', 'Nahom D.', '+251 955 678901', 'team_alpha', 'Active', 4.6, 4, 'https://i.pravatar.cc/150?u=b5'),
('b6', 'Mikias A.', '+251 966 789012', 'team_gamma', 'Active', 5.0, 2, 'https://i.pravatar.cc/150?u=b6');

-- Insert Demo Properties
INSERT INTO properties (id, ownerId, type, status, price, location, lat, lng, bedrooms, bathrooms, area, furnished, amenities, photos, listedDate) VALUES
('p1', 'o1', 'Apartment', 'Available', 45000, 'Bole Atlas', 9.001, 38.785, 2, 2, 120, true, ARRAY['Generator', 'WiFi', 'Security'], ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'], '2024-05-15'),
('p2', 'o2', 'Villa', 'Pending', 120000, 'CMC', 9.020, 38.830, 4, 3, 350, false, ARRAY['Garden', 'Parking', 'Maid Room'], ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'], '2024-05-18'),
('p3', 'o1', 'Condominium', 'Available', 25000, 'Ayat', 9.015, 38.860, 2, 1, 85, false, ARRAY['Parking'], ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'], '2024-05-20'),
('p4', 'o3', 'Commercial', 'Available', 150000, 'Kazanchis', 9.012, 38.770, 0, 4, 500, false, ARRAY['Elevator', 'Security', 'Parking'], ARRAY['https://images.unsplash.com/photo-1497366216548-37526070297c'], '2024-05-22'),
('p5', 'o2', 'Apartment', 'Sold', 60000, 'Bole Rwanda', 8.995, 38.790, 3, 2, 150, true, ARRAY['Gym', 'Generator', 'Security'], ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750'], '2024-05-10');

-- Insert Demo Owners
INSERT INTO owners (id, name, phone, type, rating, properties) VALUES
('o1', 'Sunshine Real Estate', '+251 115 123456', 'Developer', 4.5, 24),
('o2', 'Abebe Kebede', '+251 911 987654', 'Private', 4.2, 3),
('o3', 'Ethio Properties', '+251 116 234567', 'Agency', 4.8, 15);
