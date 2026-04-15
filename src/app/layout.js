import "./globals.css";

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
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
