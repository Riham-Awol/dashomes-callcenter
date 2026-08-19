export type UserRole =
  | 'System Administrator'
  | 'Property & Broker Manager'
  | 'Call Center Operator'
  | 'Team Member (Field Agent)';

export interface User {
  u: string;
  p: string;
  name: string;
  role: UserRole;
  teamId?: string;
}

export interface Session {
  u: string;
  name: string;
  role: UserRole;
  teamId?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  phone: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  lead?: string;
  phone?: string;
  date?: string; // Daily team creation date
  members: TeamMember[]; // Registered members by Name & Phone
}

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Broker {
  id: string;
  name: string;
  phone: string;
  address?: string;
  area?: string;
  notes: string;
  active: boolean;
  approvalStatus: ApprovalStatus;
}

export interface Owner {
  id: string;
  name: string;
  phone: string;
  notes: string;
}

export type PropertyType =
  | 'Apartment'
  | 'Villa'
  | 'Townhouse'
  | 'Penthouse'
  | 'Studio'
  | 'Commercial'
  | 'Land'
  | 'Other';

export interface Property {
  id: string;
  name: string;
  owner: string;
  phone: string;
  brokerId?: string; // Optional link to registered broker who brought the property
  type: PropertyType;
  customType?: string; // If type === 'Other'
  floors?: string;
  bedrooms: number;
  bathrooms?: number;
  listing: 'rent' | 'sale';
  leaseDuration?: string; // Lease duration if listing === 'rent'
  minRent?: number | string;
  furnished: boolean;
  sqm: number;
  address: string;
  unitFloor?: string;
  amenities: string;
  price: number;
  fee: number;
  deposit: number;
  lat?: number | null;
  lng?: number | null;
  notes: string;
  photo?: string | null;
  photos?: string[]; // Up to 2 cover photos
  remarks?: string;
  approvalStatus: ApprovalStatus;
  assignedTeamId?: string;
}

export type AppointmentKind = 'broker' | 'owner';
export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'Completed' | 'Incomplete' | 'Cancelled';

export interface Appointment {
  id: string;
  dt: string;
  kind: AppointmentKind;
  contactId: string;
  name: string;
  phone: string;
  propId: string;
  address: string;
  teamId: string;
  status: AppointmentStatus;
  notes: string;
  lat?: number | null;
  lng?: number | null;
  isShoot?: boolean; // "Shoot" appointment flag for multiple appointments with one broker
  incompletionReason?: string; // Mandatory reason if Incomplete
  completedByMembers?: string[]; // Member names who completed it
  assignedMembersSnapshot?: TeamMember[]; // Snapshot of team members on appointment day
}

export type FollowUpStatus =
  | 'New lead'
  | 'Contacted'
  | 'Waiting for manager approval'
  | 'Negotiating'
  | 'Documents pending'
  | 'Meeting scheduled'
  | 'Closed - Won'
  | 'Lost';

export interface FollowUp {
  id: string;
  doc: string;
  name: string;
  phone: string;
  property: string;
  status: FollowUpStatus;
  next: string;
  action: string;
  priority?: 'Normal' | 'High';
}

export interface Activity {
  ts: number;
  text: string;
  type?: 'status_update' | 'approval' | 'assignment' | 'general';
}

export interface NotificationItem {
  id: string;
  ts: number;
  title: string;
  message: string;
  type: 'completed' | 'incomplete' | 'approval_required';
  read: boolean;
}

export interface DatabaseSchema {
  users: User[];
  teams: Team[];
  brokers: Broker[];
  owners: Owner[];
  properties: Property[];
  appointments: Appointment[];
  followups: FollowUp[];
  activity: Activity[];
  notifications?: NotificationItem[];
}

export type ViewId =
  | 'dashboard'
  | 'appointments'
  | 'schedule'
  | 'map'
  | 'brokers'
  | 'properties'
  | 'followups'
  | 'teams'
  | 'users'
  | 'analytics';
