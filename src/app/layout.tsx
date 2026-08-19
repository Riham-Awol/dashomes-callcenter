import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Das Homes CallCenter — Operations Console',
  description: 'Operations console for Das Homes call center',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23F6F1E3'/%3E%3Cpath d='M11 34 L32 16 L53 34' fill='none' stroke='%2335713D' stroke-width='6'/%3E%3Cpath d='M21 28v-9h6v5' fill='%2335713D'/%3E%3Ctext x='32' y='54' font-family='Georgia,serif' font-size='20' font-weight='bold' fill='%2335713D' text-anchor='middle'%3EDH%3C/text%3E%3C/svg%3E"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..900&family=Karla:ital,wght@0,300..800;1,300..800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="grain" />
        {children}
      </body>
    </html>
  );
}
