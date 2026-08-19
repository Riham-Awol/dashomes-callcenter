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
  focusedLocation?: { lat: number; lng: number; label?: string } | null;
  drawRoutePath?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function LeafletMap({
  appointments = [],
  properties = [],
  teams = [],
  isMiniMap = false,
  filterTypes = new Set(['broker', 'owner', 'property', 'pinned']),
  filterTeams = new Set(),
  focusedLocation,
  drawRoutePath = true,
  onMapClick
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  const teamById = (id: string) => teams.find(t => t.id === id);

  function createPinIcon(L: any, color: string, kind: 'home' | 'cam' | 'num', numStr?: string) {
    if (kind === 'num') {
      const html = `<div style="background:${color};color:#fff;font-weight:800;font-size:12px;font-family:sans-serif;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${numStr}</div>`;
      return L.divIcon({
        className: '',
        html,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });
    }

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
    const title = a.name || 'Scheduled Visit';
    const addr = a.address || 'Location Pinned';
    const kind = a.kind || 'owner';
    const dtStr = a.dt ? fmtDT(a.dt) : '10:00 AM';
    const status = a.status || 'Scheduled';
    const notes = a.notes || '';

    return `<div class="pop-t">${addr}</div>
    <div class="pop-m">${dtStr}</div>
    <div style="margin-top:6px"><b>${title}</b> · <span class="src-chip ${kind === 'broker' ? 'src-broker' : 'src-owner'}">${kind}</span></div>
    <div style="margin-top:5px"><span class="team-dot" style="background:${t ? t.color : '#9AA392'}"></span><b>${t ? t.name : 'Unassigned'}</b></div>
    <div style="margin-top:4px"><span class="chip s-${status}" style="border:none">${status}</span></div>
    ${notes ? `<div style="margin-top:6px;font-size:12px;color:var(--muted);font-style:italic">${notes}</div>` : ''}`;
  }

  function popProp(p: Property) {
    const name = p.name || 'Registered Property';
    const addr = p.address || 'Location Pinned';
    const listing = p.listing || 'rent';
    const type = p.type || 'Property';
    const priceStr = p.price != null ? fmtMoney(p.price) : 'Contact Agent';
    const owner = p.owner || 'Registered Owner';
    const phone = p.phone || '';

    return `<div class="pop-t">${name}</div>
    <div class="pop-m">${addr}</div>
    <div style="margin-top:6px">
      <span class="chip ${listing === 'sale' ? 'ch-gold' : 'ch-sage'}" style="border:none">${listing}</span>
      <span class="chip ch-blue" style="border:none">${type}</span>
      ${p.furnished ? '<span class="chip ch-gray" style="border:none">furnished</span>' : ''}
    </div>
    <div style="margin-top:6px;font:700 15px Fraunces;color:var(--gold)">
      ${priceStr}${listing === 'rent' ? '<small style="font:600 10px Karla;color:var(--muted)"> /mo</small>' : ''}
    </div>
    <div style="margin-top:4px;font:500 11px \'IBM Plex Mono\';color:var(--muted)">${owner}${phone ? ' · ' + phone : ''}</div>`;
  }

  // Nearest-Neighbor Shortest Path TSP algorithm for connecting daily stops
  function computeShortestRoute(points: { lat: number; lng: number; title: string }[]) {
    if (points.length < 2) return points;

    const unvisited = [...points];
    const route = [unvisited.shift()!];

    while (unvisited.length > 0) {
      const current = route[route.length - 1];
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const d = Math.hypot(unvisited[i].lat - current.lat, unvisited[i].lng - current.lng);
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }

      route.push(unvisited.splice(nearestIdx, 1)[0]);
    }

    return route;
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

        const initialLat = focusedLocation?.lat || 9.005;
        const initialLng = focusedLocation?.lng || 38.79;
        const initialZoom = focusedLocation ? 16 : 12;

        const map = L.map(containerRef.current, mapOptions).setView([initialLat, initialLng], initialZoom);

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

      // Update pins and routes
      const map = mapInstanceRef.current;
      const layerGroup = layerGroupRef.current;
      if (!map || !layerGroup) return;

      layerGroup.clearLayers();
      const pts: [number, number][] = [];
      const routePoints: { lat: number; lng: number; title: string; color?: string }[] = [];

      // If redirected to a focused location, center map exactly there
      if (focusedLocation && focusedLocation.lat != null && focusedLocation.lng != null) {
        map.setView([focusedLocation.lat, focusedLocation.lng], 16, { animate: true });
      }

      appointments.forEach(a => {
        if (!isMiniMap && !filterTypes.has(a.kind)) return;
        const tk = a.teamId || 'unassigned';
        if (!isMiniMap && filterTeams.size > 0 && !filterTeams.has(tk)) return;
        if (a.lat != null && a.lng != null) {
          const t = teamById(a.teamId);
          const pinColor = t?.color || '#0288D1';
          const icon = createPinIcon(L, pinColor, 'cam');
          const marker = L.marker([a.lat, a.lng], { icon }).bindPopup(popAppt(a));
          layerGroup.addLayer(marker);

          if (focusedLocation && Math.abs(a.lat - focusedLocation.lat) < 0.0001 && Math.abs(a.lng - focusedLocation.lng) < 0.0001) {
            marker.openPopup();
          }

          pts.push([a.lat, a.lng]);
          routePoints.push({ lat: a.lat, lng: a.lng, title: a.name || a.address, color: pinColor });
        }
      });

      properties.forEach(p => {
        if (!isMiniMap && !filterTypes.has('property')) return;
        if (p.lat != null && p.lng != null) {
          const icon = createPinIcon(L, '#8C6A1F', 'home');
          const marker = L.marker([p.lat, p.lng], { icon }).bindPopup(popProp(p));
          layerGroup.addLayer(marker);

          if (focusedLocation && Math.abs(p.lat - focusedLocation.lat) < 0.0001 && Math.abs(p.lng - focusedLocation.lng) < 0.0001) {
            marker.openPopup();
          }

          pts.push([p.lat, p.lng]);
        }
      });

      // Draw Shortest Route Path (TSP sequence) for scheduled day visits
      if (drawRoutePath && routePoints.length >= 2) {
        const sortedRoute = computeShortestRoute(routePoints);
        const latLngs: [number, number][] = sortedRoute.map(pt => [pt.lat, pt.lng]);

        // Draw polyline connecting all visits in shortest order
        const polyline = L.polyline(latLngs, {
          color: '#B8860B',
          weight: 4.5,
          opacity: 0.85,
          dashArray: '8, 10',
          lineCap: 'round'
        });
        layerGroup.addLayer(polyline);

        // Render sequence numbers (1, 2, 3... N) along the path
        sortedRoute.forEach((pt, idx) => {
          const numIcon = createPinIcon(L, '#2E4632', 'num', String(idx + 1));
          const numMarker = L.marker([pt.lat, pt.lng], { icon: numIcon }).bindPopup(
            `<b>Stop #${idx + 1}</b><br/>${pt.title}`
          );
          layerGroup.addLayer(numMarker);
        });
      }

      if (!focusedLocation && pts.length > 0) {
        map.fitBounds(pts, { padding: isMiniMap ? [24, 24] : [36, 36], maxZoom: 14 });
      }

      setTimeout(() => map.invalidateSize(), 150);
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [appointments, properties, teams, isMiniMap, filterTypes, filterTeams, focusedLocation, drawRoutePath]);

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
