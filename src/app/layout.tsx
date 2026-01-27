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
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
