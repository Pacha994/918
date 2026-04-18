import { Barlow_Semi_Condensed } from 'next/font/google'
import "./globals.css";

const barlow = Barlow_Semi_Condensed({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-barlow',
})

export const metadata = {
  title: "918",
  description: "El taller en tu bolsillo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "918",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#111111",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={barlow.variable}>
      <body>{children}</body>
    </html>
  );
}
