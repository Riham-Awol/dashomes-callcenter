'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { localMatches, GazetteerLocation } from '@/lib/gazetteer';

const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), { ssr: false });

interface MapPinPickerProps {
  initialPin?: { lat: number; lng: number } | null;
  onPinChange: (pin: { lat: number; lng: number } | null) => void;
}

export function MapPinPicker({ initialPin, onPinChange }: MapPinPickerProps) {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(initialPin || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { name: string; lat: number; lng: number; isOnline?: boolean }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    setPin(initialPin || null);
  }, [initialPin]);

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
    const loc = localMatches(s);
    const results: { name: string; lat: number; lng: number; isOnline?: boolean }[] = loc.map(m => ({
      name: '🏘 ' + m.name,
      lat: m.lat,
      lng: m.lng,
      isOnline: false
    }));

    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 4500);
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=4&countrycodes=et&q=${encodeURIComponent(s)}`,
        { signal: ctl.signal }
      );
      clearTimeout(to);
      const j = await r.json();

      j.forEach((x: any) => {
        results.push({
          name: '🌐 ' + x.display_name.split(',').slice(0, 3).join(','),
          lat: +x.lat,
          lng: +x.lon,
          isOnline: true
        });
      });

      if (!results.length) {
        setStatusMsg('No matches — click the map or use an area name (Bole, Kazanchis…).');
      }
    } catch (e) {
      if (!results.length) {
        setStatusMsg('Geocoder offline — try an Addis area name, or click the map.');
      }
    } finally {
      setSearchResults(results);
      setSearching(false);
    }
  };

  return (
    <div className="picker-box">
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          className="inp"
          placeholder="Search area — Bole, Kazanchis, CMC…"
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
