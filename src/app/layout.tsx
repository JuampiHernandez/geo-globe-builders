import type { Metadata } from "next";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL || "https://geo-globe-builders.vercel.app";
  
  return {
  title: "Builder Globe | Talent Protocol",
  description: "Explore builders around the world with Talent Protocol",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon.png",
  },
  openGraph: {
    title: "Builder Globe | Talent Protocol",
    description: "Explore builders around the world with Talent Protocol",
    images: [`${URL}/og-image.png`],
    type: "website",
  },
    other: {
      'base:app_id': '6979020e88e3bac59cf3dbf5',
      'fc:miniapp': JSON.stringify({
        version: 'next',
        imageUrl: `${URL}/embed-image.png`,
        button: {
          title: 'Explore Builder Globe',
          action: {
            type: 'launch_miniapp',
            name: 'Builder Globe',
            url: URL,
            splashImageUrl: `${URL}/splash.png`,
            splashBackgroundColor: '#030712',
          },
        },
      }),
    },
};
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="talentapp:project_verification" content="748b91c53e5746ecefd40c5312089ceac2e01d2c2e8c992e4de949e1a318bc17127b851bc5fb766b0e2e689e8934cecbbc026cb0cd6ef55bb3fd639b111eb9a0" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
