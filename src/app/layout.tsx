import type { Metadata } from "next";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL || "https://geo-globe-builders.vercel.app";
  
  return {
  title: "Builder Globe | Talent Protocol",
  description: "Explore builders around the world with Talent Protocol",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌍</text></svg>",
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
