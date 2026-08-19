import { Appointment, Property, Team } from '@/types';

export const esc = (v: any): string =>
  String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

export const uid = (): string => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

export const pad = (n: number | string): string => String(n).padStart(2, '0');

export function dOff(o: number): string {
  const d = new Date();
  d.setDate(d.getDate() + o);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dtOff(o: number, hm: string): string {
  const d = new Date();
  d.setDate(d.getDate() + o);
  const [h, m] = hm.split(':');
  d.setHours(+h, +m, 0, 0);
  return d.toISOString();
}

export const localYMD = (iso: string | Date): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const todayYMD = (): string => localYMD(new Date());

export const fmtMoney = (n: number | string | undefined | null): string => {
  if (n === undefined || n === null || n === '') return '—';
  const num = Number(n);
  if (isNaN(num)) return '—';
  return 'ETB ' + num.toLocaleString();
};

export const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const fmtTime = (iso: string): string => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const fmtDT = (iso: string): string => fmtDate(iso) + ' · ' + fmtTime(iso);

export const fmtD = (d: string): string => (d ? fmtDate(d + 'T00:00') : '');

export const isToday = (iso: string): boolean => localYMD(iso) === todayYMD();

export function relTime(ts: number): string {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

export function daysUntil(ymd: string): number {
  return Math.round((new Date(ymd + 'T00:00').getTime() - new Date(todayYMD() + 'T00:00').getTime()) / 86400000);
}

export function exportCSV(what: 'appointments' | 'brokers' | 'properties' | 'followups', db: any) {
  let rows: string[][] = [];
  let name = 'export';

  const teamById = (id: string) => db.teams.find((t: any) => t.id === id);

  if (what === 'appointments') {
    name = 'das-homes-appointments';
    rows = [
      ['Date', 'Time', 'Kind', 'Contact', 'Phone', 'Property Address', 'Team', 'Status', 'Notes'],
      ...db.appointments.map((a: any) => [
        fmtDate(a.dt),
        fmtTime(a.dt),
        a.kind,
        a.name,
        a.phone,
        a.address,
        (teamById(a.teamId) || {}).name || 'Unassigned',
        a.status,
        a.notes
      ])
    ];
  } else if (what === 'brokers') {
    name = 'das-homes-brokers';
    rows = [
      ['Name', 'Phone', 'Address', 'Area', 'Approval Status', 'Active Status', 'Notes'],
      ...db.brokers.map((b: any) => [b.name, b.phone, b.address || '', b.area || '', b.approvalStatus || 'Approved', b.active ? 'active' : 'inactive', b.notes])
    ];
  } else if (what === 'properties') {
    name = 'das-homes-properties';
    rows = [
      ['Name', 'Type', 'Owner', 'Phone', 'Listing', 'Lease Duration', 'Price', 'Address', 'Approval Status', 'Notes'],
      ...db.properties.map((p: any) => [
        p.name,
        p.type === 'Other' ? `Other (${p.customType || ''})` : p.type,
        p.owner,
        p.phone,
        p.listing,
        p.listing === 'rent' ? p.leaseDuration || '12 months' : 'N/A',
        fmtMoney(p.price),
        p.address,
        p.approvalStatus || 'Approved',
        p.notes
      ])
    ];
  } else if (what === 'followups') {
    name = 'das-homes-followups';
    rows = [
      ['Date of Contact', 'Contact', 'Phone', 'Property', 'Status', 'Next Follow-Up', 'Action'],
      ...db.followups.map((f: any) => [f.doc, f.name, f.phone, f.property, f.status, f.next, f.action])
    ];
  }

  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', name + '.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to Microsoft Word (.doc / .docx HTML table format)
export function exportToWordDoc(title: string, columns: string[], rows: any[][], filename: string) {
  const tableHeaders = columns.map(c => `<th style="background-color: #2E4632; color: #ffffff; padding: 10px; border: 1px solid #dddddd;">${esc(c)}</th>`).join('');
  const tableRows = rows
    .map(
      r =>
        `<tr>${r.map(c => `<td style="padding: 8px; border: 1px solid #dddddd;">${esc(c)}</td>`).join('')}</tr>`
    )
    .join('');

  const content = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${esc(title)}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
        h1 { color: #2E4632; }
        .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; font-size: 13px; }
      </style>
    </head>
    <body>
      <h1>${esc(title)}</h1>
      <div class="meta">Generated by DasHomes Operations System on ${new Date().toLocaleString()}</div>
      <table>
        <thead><tr>${tableHeaders}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + content], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.doc') ? filename : filename + '.doc';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Haversine distance calculation in kilometers
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Identify appointments within ~15-minute / 2km radius for route clustering
export function findNearbyAppointments(targetAppt: Appointment, allAppts: Appointment[], radiusKm = 2.5): Appointment[] {
  if (!targetAppt.lat || !targetAppt.lng) return [];
  return allAppts.filter(
    a =>
      a.id !== targetAppt.id &&
      a.lat &&
      a.lng &&
      getDistanceKm(targetAppt.lat!, targetAppt.lng!, a.lat, a.lng) <= radiusKm
  );
}

// Automatically and evenly distribute unassigned/scheduled bookings among active daily teams using Geographic Proximity Clustering
export function balanceTeamWorkload(appointments: Appointment[], activeTeams: Team[]): Appointment[] {
  if (!activeTeams || activeTeams.length === 0) return appointments;

  const updated = [...appointments];
  const unassignedIndices: number[] = [];

  for (let i = 0; i < updated.length; i++) {
    if (updated[i].status === 'Scheduled' || !updated[i].teamId) {
      unassignedIndices.push(i);
    }
  }

  if (unassignedIndices.length === 0) return appointments;

  // Group unassigned appointments into geographic proximity clusters (~2.5km / ~15min radius)
  const visited = new Set<number>();
  const clusters: number[][] = [];

  for (const idx of unassignedIndices) {
    if (visited.has(idx)) continue;
    const currentCluster: number[] = [idx];
    visited.add(idx);

    const apptA = updated[idx];
    if (apptA.lat && apptA.lng) {
      for (const otherIdx of unassignedIndices) {
        if (visited.has(otherIdx)) continue;
        const apptB = updated[otherIdx];
        if (apptB.lat && apptB.lng) {
          const dist = getDistanceKm(apptA.lat, apptA.lng, apptB.lat, apptB.lng);
          if (dist <= 2.5) {
            currentCluster.push(otherIdx);
            visited.add(otherIdx);
          }
        }
      }
    }
    clusters.push(currentCluster);
  }

  // Evenly assign geographic clusters to active daily teams (Team 1, Team 2... Team N)
  let teamIdx = 0;
  for (const cluster of clusters) {
    const assignedTeam = activeTeams[teamIdx % activeTeams.length];
    for (const itemIdx of cluster) {
      updated[itemIdx] = {
        ...updated[itemIdx],
        teamId: assignedTeam.id,
        assignedMembersSnapshot: assignedTeam.members || []
      };
    }
    teamIdx++;
  }

  return updated;
}

export interface TeamDaily15Route {
  team: Team;
  items: {
    id: string;
    title: string;
    address: string;
    kind: 'Booking' | 'Pinned Property';
    lat?: number | null;
    lng?: number | null;
    time?: string;
    status?: string;
  }[];
}

// Generate exactly 15 assigned properties/visits for each active daily team
export function generateTeamDaily15Routes(
  appointments: Appointment[],
  properties: Property[],
  activeTeams: Team[],
  pinnedLocations?: { id: string; name: string; lat: number; lng: number; area: string }[]
): TeamDaily15Route[] {
  if (!activeTeams || activeTeams.length === 0) return [];

  const balancedAppts = balanceTeamWorkload(appointments, activeTeams);
  const pins = pinnedLocations || [];

  return activeTeams.map((t, teamIdx) => {
    const teamAppts = balancedAppts.filter(a => a.teamId === t.id && isToday(a.dt));
    const items: TeamDaily15Route['items'] = teamAppts.map(a => ({
      id: a.id,
      title: `${a.name} (${a.kind})`,
      address: a.address,
      kind: 'Booking',
      lat: a.lat,
      lng: a.lng,
      time: a.dt ? fmtTime(a.dt) : '10:00 AM',
      status: a.status
    }));

    // Step 1: Fill with approved properties if bookings < 15
    if (items.length < 15) {
      const remainingNeed = 15 - items.length;
      const unassignedProps = properties.filter(
        p => (p.approvalStatus || 'Approved') === 'Approved' && !items.some(it => it.address === p.address)
      );

      for (let i = 0; i < Math.min(remainingNeed, unassignedProps.length); i++) {
        const pr = unassignedProps[i];
        items.push({
          id: `prop_fill_${t.id}_${pr.id}_${i}`,
          title: `Property Shoot: ${pr.name}`,
          address: pr.address,
          kind: 'Pinned Property',
          lat: pr.lat,
          lng: pr.lng,
          time: `${9 + (i % 8)}:00 AM`,
          status: 'Scheduled'
        });
      }
    }

    // Step 2: Fill remaining with pinned gazetteer locations (evenly distributed across teams)
    if (items.length < 15 && pins.length > 0) {
      const remainingNeed = 15 - items.length;
      const pinsPerTeam = Math.ceil(pins.length / activeTeams.length);
      const teamPins = pins.slice(teamIdx * pinsPerTeam, (teamIdx + 1) * pinsPerTeam);

      for (let i = 0; i < Math.min(remainingNeed, teamPins.length); i++) {
        const pin = teamPins[i];
        items.push({
          id: `pin_fill_${t.id}_${pin.id}_${i}`,
          title: `📌 ${pin.name}`,
          address: `${pin.area}, Bole Subcity`,
          kind: 'Pinned Property',
          lat: pin.lat,
          lng: pin.lng,
          time: `${9 + (i % 8)}:${i % 2 === 0 ? '00' : '30'} AM`,
          status: 'Scheduled'
        });
      }
    }

    return {
      team: t,
      items: items.slice(0, 15)
    };
  });
}

