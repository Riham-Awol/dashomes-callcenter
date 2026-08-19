'use client';

import React, { useEffect, useRef } from 'react';
import { Appointment, Property, Team } from '@/types';
import { fmtDT, fmtMoney } from '@/lib/utils';

interface LeafletMapProps {
  appointments?: Appointment[];
  properties?: Property[];
  teams?: Team[];
  isMiniMap?: boolean;
  filterTypes?: Set<string>;
  filterTeams?: Set<string>;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function LeafletMap({
  appointments = [],
  properties = [],
  teams = [],
  isMiniMap = false,
  filterTypes = new Set(['broker', 'owner', 'property']),
  filterTeams = new Set(),
  onMapClick
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  const teamById = (id: string) => teams.find(t => t.id === id);

  function createPinIcon(L: any, color: string, kind: 'home' | 'cam') {
    const glyph =
      kind === 'home'
        ? `<path d="M9.5 14.8v-4.2l3.5-2.9 3.5 2.9v4.2h-2.5v-2.6h-2v2.6z" fill="#fff"/>`
        : `<rect x="9.3" y="10.8" width="7.4" height="5.6" rx="1.2" fill="#fff"/><circle cx="13" cy="13.6" r="1.7" fill="${color}"/><rect x="11.3" y="9.6" width="3.4" height="1.6" rx=".5" fill="#fff"/>`;

    const html = `<div class="pinwrap"><svg width="30" height="42" viewBox="0 0 26 36">
      <path d="M13 1C6.4 1 1 6.4 1 13c0 9 12 22 12 22s12-13 12-22C25 6.4 19.6 1 13 1z" fill="${color}" stroke="#FDFAF1" stroke-width="1.8"/>
      ${glyph}</svg></div>`;

    return L.divIcon({
      className: '',
      html,
      iconSize: [30, 42],
      iconAnchor: [15, 40],
      popupAnchor: [0, -36]
    });
  }

  function popAppt(a: Appointment) {
    const t = teamById(a.teamId);
    return `<div class="pop-t">${a.address}</div><div class="pop-m">${fmtDT(a.dt)}</div>
    <div style="margin-top:6px">${a.name} · <span class="src-chip ${a.kind === 'broker' ? 'src-broker' : 'src-owner'}">${a.kind}</span></div>
    <div style="margin-top:5px"><span class="team-dot" style="background:${t ? t.color : '#9AA392'}"></span><b>${t ? t.name : 'Unassigned'}</b>${t ? ` — ${t.lead}` : ''}</div>
    <div style="margin-top:4px"><span class="chip s-${a.status}" style="border:none">${a.status}</span></div>
    ${a.notes ? `<div style="margin-top:6px;font-size:12px;color:var(--muted);font-style:italic">${a.notes}</div>` : ''}`;
  }

  function popProp(p: Property) {
    return `<div class="pop-t">${p.name}</div><div class="pop-m">${p.address}</div>
    <div style="margin-top:6px"><span class="chip ${p.listing === 'sale' ? 'ch-gold' : 'ch-sage'}" style="border:none">${p.listing}</span>
    <span class="chip ch-blue" style="border:none">${p.type}</span> ${p.furnished ? '<span class="chip ch-gray" style="border:none">furnished</span>' : ''}</div>
    <div style="margin-top:6px;font:700 15px Fraunces;color:var(--gold)">${fmtMoney(p.price)}${p.listing === 'rent' ? '<small style="font:600 10px Karla;color:var(--muted)"> /mo</small>' : ''}</div>
    <div style="margin-top:4px;font:500 11px \'IBM Plex Mono\';color:var(--muted)">${p.owner} · ${p.phone}</div>`;
  }

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    let L: any = null;

    const initMap = async () => {
      L = (await import('leaflet')).default;
      if (!isMounted || !containerRef.current) return;

      if (!mapInstanceRef.current) {
        const mapOptions = isMiniMap
          ? { zoomControl: false, scrollWheelZoom: false }
          : { zoomControl: true };

        const map = L.map(containerRef.current, mapOptions).setView([9.005, 38.79], 12);

        // Tile layer with fallback
        const TILES = [
          ['https://tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap'],
          ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap'],
          ['https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', '© CARTO']
        ];

        let idx = 0;
        let layer = L.tileLayer(TILES[0][0], { attribution: TILES[0][1] }).addTo(map);
        layer.on('tileerror', () => {
          if (idx < TILES.length - 1) {
            idx++;
            try { map.removeLayer(layer); } catch (e) { }
            layer = L.tileLayer(TILES[idx][0], { attribution: TILES[idx][1] }).addTo(map);
          }
        });

        const layerGroup = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        layerGroupRef.current = layerGroup;

        if (onMapClick) {
          map.on('click', (e: any) => {
            onMapClick(e.latlng.lat, e.latlng.lng);
          });
        }
      }

      // Update pins
      const map = mapInstanceRef.current;
      const layerGroup = layerGroupRef.current;
      if (!map || !layerGroup) return;

      layerGroup.clearLayers();
      const pts: [number, number][] = [];

      appointments.forEach(a => {
        if (!isMiniMap && !filterTypes.has(a.kind)) return;
        const tk = a.teamId || 'unassigned';
        if (!isMiniMap && filterTeams.size > 0 && !filterTeams.has(tk)) return;
        if (a.lat != null && a.lng != null) {
          const t = teamById(a.teamId);
          const icon = createPinIcon(L, t?.color || '#9AA392', 'cam');
          const marker = L.marker([a.lat, a.lng], { icon }).bindPopup(popAppt(a));
          layerGroup.addLayer(marker);
          pts.push([a.lat, a.lng]);
        }
      });

      properties.forEach(p => {
        if (!isMiniMap && !filterTypes.has('property')) return;
        if (p.lat != null && p.lng != null) {
          const icon = createPinIcon(L, '#8C6A1F', 'home');
          const marker = L.marker([p.lat, p.lng], { icon }).bindPopup(popProp(p));
          layerGroup.addLayer(marker);
          pts.push([p.lat, p.lng]);
        }
      });

      if (pts.length > 0) {
        map.fitBounds(pts, { padding: isMiniMap ? [24, 24] : [36, 36], maxZoom: 14 });
      }

      setTimeout(() => map.invalidateSize(), 150);
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [appointments, properties, teams, isMiniMap, filterTypes, filterTeams]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) { }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: isMiniMap ? '264px' : '440px' }} />;
}
