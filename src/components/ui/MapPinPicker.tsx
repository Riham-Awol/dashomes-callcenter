'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { localMatches } from '@/lib/gazetteer';
import { BOLE_PINNED_LOCATIONS } from '@/lib/pinnedLocations';

const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), { ssr: false });

interface MapPinPickerProps {
  initialPin?: { lat: number; lng: number } | null;
  onPinChange: (pin: { lat: number; lng: number } | null) => void;
}

export function MapPinPicker({ initialPin, onPinChange }: MapPinPickerProps) {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(initialPin || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [onlineResults, setOnlineResults] = useState<
    { name: string; lat: number; lng: number; isOnline?: boolean }[]
  >([]);

  useEffect(() => {
    setPin(initialPin || null);
  }, [initialPin]);

  // Instant local matches from the imported pinned map (apartment / place names)
  // plus the area gazetteer — searched by name, area, or address.
  const localResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as { name: string; lat: number; lng: number; kind: 'pin' | 'area' }[];

    const pins = BOLE_PINNED_LOCATIONS.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.area || '').toLowerCase().includes(q) ||
        (p.address || '').toLowerCase().includes(q)
    )
      .slice(0, 25)
      .map(p => ({ name: `📌 ${p.name} · ${p.area}`, lat: p.lat, lng: p.lng, kind: 'pin' as const }));

    const areas = localMatches(searchQuery).map(m => ({
      name: `🏘 ${m.name}`,
      lat: m.lat,
      lng: m.lng,
      kind: 'area' as const
    }));

    return [...pins, ...areas];
  }, [searchQuery]);

  // Clear any previous online results when the query changes
  useEffect(() => {
    setOnlineResults([]);
    setStatusMsg('');
  }, [searchQuery]);

  const handlePlace = (lat: number, lng: number) => {
    const newPin = { lat, lng };
    setPin(newPin);
    onPinChange(newPin);
  };

  const handleSearch = async () => {
    const s = searchQuery.trim();
    if (!s) return;

    setSearching(true);
    setStatusMsg('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const online: { name: string; lat: number; lng: number; isOnline?: boolean }[] = [];
    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 4500);
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=4&countrycodes=et&q=${encodeURIComponent(s)}`,
        { signal: ctl.signal }
      );
      clearTimeout(to);
      const j = await r.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      j.forEach((x: any) => {
        online.push({
          name: '🌐 ' + x.display_name.split(',').slice(0, 3).join(','),
          lat: +x.lat,
          lng: +x.lon,
          isOnline: true
        });
      });

      if (!online.length && !localResults.length) {
        setStatusMsg('No matches — click the map, or type part of an apartment / area name.');
      }
    } catch (e) {
      if (!localResults.length) {
        setStatusMsg('Online geocoder unavailable — pinned & area names still work, or click the map.');
      }
    } finally {
      setOnlineResults(online);
      setSearching(false);
    }
  };

  // Instant local matches first, then any online geocoder results
  const searchResults = [...localResults, ...onlineResults];

  return (
    <div className="picker-box">
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          className="inp"
          placeholder="Search apartment / place name or area — e.g. Atlas, Medhanialem, Bole…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button type="button" className="btn btn-sec btn-sm" onClick={handleSearch} disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div style={{ marginTop: '6px' }}>
        {searchResults.map((m, idx) => (
          <button
            key={idx}
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ margin: '3px 4px 0 0' }}
            onClick={() => handlePlace(m.lat, m.lng)}
          >
            {m.name}
          </button>
        ))}
        {statusMsg && (
          <span style={{ font: "500 12px 'Karla', sans-serif", color: 'var(--clay)', display: 'block', marginTop: '6px' }}>
            {statusMsg}
          </span>
        )}
      </div>

      <div className="pk-map">
        <LeafletMap
          isMiniMap
          appointments={
            pin ? [{ id: 'picker', dt: new Date().toISOString(), kind: 'broker', contactId: '', name: 'Selected Pin', phone: '', propId: '', address: '', teamId: '', status: 'Scheduled', notes: '', lat: pin.lat, lng: pin.lng }] : []
          }
          onMapClick={(lat, lng) => handlePlace(lat, lng)}
        />
      </div>

      <span className="pin-state">
        {pin
          ? `📍 pinned · ${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`
          : 'not pinned — will auto-pin from address on save'}
      </span>
    </div>
  );
}
