export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL as string;
  
  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjY3MzAsInR5cGUiOiJhdXRoIiwia2V5IjoiMHg5NEZDQzdGYUQ3RjQyM2MwRjQ3Q2VFMjU2RGY5RjU5YzIwMjJFQ2FFIn0",
      payload: "eyJkb21haW4iOiJnZW8tZ2xvYmUtYnVpbGRlcnMudmVyY2VsLmFwcCJ9",
      signature: "T+ChxU5+dlPGonP9mbCbzV9F2p3WbNKCBDuOqNn/UtJmENRV3+j/tbxtMtabuCdWa5VVy8B0f/kAZoMcIotE8Bw="
    },
    miniapp: {
      version: "1",
      name: "Builder Globe",
      homeUrl: URL || "https://your-domain.com",
      iconUrl: `${URL || "https://your-domain.com"}/icon.png`,
      splashImageUrl: `${URL || "https://your-domain.com"}/splash.png`,
      splashBackgroundColor: "#030712",
      webhookUrl: `${URL || "https://your-domain.com"}/api/webhook`,
      subtitle: "Explore builders worldwide",
      description: "Discover talented builders globally with Talent Protocol. View statistics, rankings, and ecosystem participation on an interactive 3D globe.",
      screenshotUrls: [
        `${URL || "https://your-domain.com"}/screenshot-1.png`,
        `${URL || "https://your-domain.com"}/screenshot-2.png`,
        `${URL || "https://your-domain.com"}/screenshot-3.png`
      ],
      primaryCategory: "social",
      tags: ["builders", "talent", "globe", "visualization", "base"],
      heroImageUrl: `${URL || "https://your-domain.com"}/hero.png`,
      tagline: "Discover builders worldwide",
      ogTitle: "Builder Globe",
      ogDescription: "Explore talented builders around the world on an interactive 3D globe",
      ogImageUrl: `${URL || "https://your-domain.com"}/og-image.png`,
      noindex: false
    }
  };

  return Response.json(manifest);
}
