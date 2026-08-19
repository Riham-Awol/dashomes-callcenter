export interface GazetteerLocation {
  name: string;
  lat: number;
  lng: number;
}

export const GAZETTEER: [string, number, number][] = [
  ['Bole Medhanealem', 9.0196, 38.7889],
  ['Bole Vista', 9.0080, 38.8050],
  ['Bole', 9.0090, 38.7700],
  ['Olympia', 9.0054, 38.7700],
  ['Summit', 8.9990, 38.8230],
  ['Kazanchis', 9.0150, 38.7610],
  ['Piassa', 9.0350, 38.7500],
  ['Megenagna', 9.0209, 38.8010],
  ['CMC', 9.0135, 38.8345],
  ['Ayat', 9.0300, 38.8600],
  ['Gerji', 8.9880, 38.7900],
  ['Sarbet', 8.9910, 38.7430],
  ['Lideta', 9.0200, 38.7350],
  ['Mexico Square', 9.0100, 38.7480],
  ['Kality', 8.9170, 38.7980],
  ['Lebu', 8.9450, 38.7300],
  ['4 Kilo', 9.0300, 38.7650],
  ['Arat Kilo', 9.0300, 38.7650],
  ['6 Kilo', 9.0390, 38.7620],
  ['Jemo', 8.9650, 38.7050],
  ['Kera', 8.9950, 38.7300],
  ['Kolfe', 9.0050, 38.7000],
  ['Shiro Meda', 9.0500, 38.7600],
  ['Gurd Shola', 9.0450, 38.8100],
  ['Kotebe', 9.0500, 38.8300],
  ['Old Airport', 9.0100, 38.7300],
  ['Stadium', 9.0250, 38.7550],
  ['Kirkos', 9.0100, 38.7650],
  ['Nifas Silk', 8.9800, 38.7300],
  ['Saris', 8.9600, 38.7600],
  ['Lam Hotel', 9.0250, 38.7900],
  ['Gotera', 8.9750, 38.7450],
  ['Jaka', 8.9700, 38.7800],
  ['Koye Feche', 8.9400, 38.8100],
  ['Akaki', 8.9000, 38.7700],
  ['Bethel', 8.9950, 38.8250],
  ['Mazoria', 8.9900, 38.7700],
  ['Goro', 8.9800, 38.8100],
  ['Asko', 8.9500, 38.7700],
  ['Mekanisa', 8.9700, 38.7200],
  ['Winget', 9.0100, 38.7200],
  ['Shola', 9.0400, 38.7900],
  ['HGS', 9.0300, 38.7900],
  ['Crown', 8.9900, 38.7800],
  ['Dembel', 9.0120, 38.7570],
  ['Edna Mall', 9.0000, 38.7850]
];

export function localMatches(query: string): GazetteerLocation[] {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  const out: GazetteerLocation[] = [];
  for (const [n, la, ln] of GAZETTEER) {
    const k = n.toLowerCase();
    if (q.includes(k) || k.includes(q) || q.split(/[\s,]+/).some(w => w.length > 2 && k.includes(w))) {
      out.push({ name: n, lat: la, lng: ln });
      if (out.length >= 6) break;
    }
  }
  return out;
}

export function autoPin(address: string): { lat: number; lng: number } | null {
  const a = (address || '').toLowerCase();
  for (const [n, la, ln] of GAZETTEER) {
    if (a.includes(n.toLowerCase())) {
      const h = [...a].reduce((s, c) => s + c.charCodeAt(0), 7);
      return {
        lat: +((la + (((h % 97) / 97) - 0.5) * 0.01).toFixed(5)),
        lng: +((ln + (((h % 89) / 89) - 0.5) * 0.01).toFixed(5))
      };
    }
  }
  return null;
}
