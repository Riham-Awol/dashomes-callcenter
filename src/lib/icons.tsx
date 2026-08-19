import React from 'react';

export const IC: Record<string, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  cal: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.6 20c0-3.5 2.9-5.8 6.4-5.8s6.4 2.3 6.4 5.8" />
      <circle cx="17.5" cy="9.5" r="2.6" />
      <path d="M16.5 14.6c2.8.3 4.9 2.3 4.9 5.4" />
    </>
  ),
  home: (
    <>
      <path d="M3 21h18M5 21V5.5A1.5 1.5 0 0 1 6.5 4H13v17M13 9h4.5A1.5 1.5 0 0 1 19 10.5V21" />
      <path d="M8 8h1.5M8 12h1.5M8 16h1.5M16 13h1M16 17h1" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M8 17v-6M13 17V7M18 17v-3" />
    </>
  ),
  cam: (
    <>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.6l1.8-2.8h6.2L16.9 7h2.6A1.5 1.5 0 0 1 21 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z" />
      <circle cx="12" cy="13" r="3.4" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.7 3.8a2.1 2.1 0 0 1 3 3L7.5 19 3.5 20l1-4z" />
    </>
  ),
  trash: (
    <>
      <path d="M3.5 6h17M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6M18.5 6l-.9 13a2 2 0 0 1-2 1.9H8.4a2 2 0 0 1-2-1.9L5.5 6M10 10.5v6M14 10.5v6" />
    </>
  ),
  phone: (
    <>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.7a16 16 0 0 0 6.3 6.3l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" />
    </>
  ),
  bed: (
    <>
      <path d="M2.5 17.5h19M2.5 17.5v-6a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2v6M2.5 17.5V20M21.5 17.5V20M6 9.5v-2h5v2" />
    </>
  ),
  area: (
    <>
      <path d="M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 2.5 20h19z" />
      <path d="M12 9.5v5M12 17.4v.2" />
    </>
  ),
  stairs: (
    <>
      <path d="M3 20h4v-4h4v-4h4V8h4V4" />
    </>
  ),
  check: (
    <>
      <path d="M5 13l4 4L19 7" />
    </>
  )
};

export interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 16, className = '', style }: IconProps) {
  const content = IC[name];
  if (!content) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, ...style }}
    >
      {content}
    </svg>
  );
}

export function LogoTile({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`logo-tile ${className}`} style={{ width: `${size}px`, height: `${size}px` }}>
      <svg viewBox="0 0 150 132">
        <path d="M22 58 L75 20 L128 58" fill="none" stroke="#35713D" strokeWidth="9" strokeLinecap="square" />
        <path d="M46 41 V24 h9 v11" fill="#35713D" />
        <text x="75" y="94" textAnchor="middle" fontFamily="Fraunces,Georgia,serif" fontSize="40" fontWeight="600" fill="#35713D">
          Das
        </text>
        <text x="75" y="128" textAnchor="middle" fontFamily="Fraunces,Georgia,serif" fontSize="40" fontWeight="600" fill="#35713D">
          Homes
        </text>
      </svg>
    </div>
  );
}
