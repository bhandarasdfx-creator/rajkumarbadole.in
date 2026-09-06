import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'राजकुमार बडोले | डिजिटल न्यूज रूम व डेटा फीडर',
  description: 'rajkumarbadole.in साठी मल्टी-युझर न्यूज रूम, विकासकामे, उपक्रम आणि मतदारसंघ डेटा फीडिंग पोर्टल.',
  icons: {
    icon: '/assets/rajkumar-badole-logo.png',
    apple: '/assets/rajkumar-badole-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mr">
      <head>
        <link rel="icon" href="/assets/rajkumar-badole-logo.png" />
      </head>
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased selection:bg-amber-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
