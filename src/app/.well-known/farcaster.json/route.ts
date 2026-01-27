export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL || "https://geo-globe-builders.vercel.app";
  
  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjY3MzAsInR5cGUiOiJhdXRoIiwia2V5IjoiMHg5NEZDQzdGYUQ3RjQyM2MwRjQ3Q2VFMjU2RGY5RjU5YzIwMjJFQ2FFIn0",
      payload: "eyJkb21haW4iOiJnZW8tZ2xvYmUtYnVpbGRlcnMudmVyY2VsLmFwcCJ9",
      signature: "T+ChxU5+dlPGonP9mbCbzV9F2p3WbNKCBDuOqNn/UtJmENRV3+j/tbxtMtabuCdWa5VVy8B0f/kAZoMcIotE8Bw="
    },
    miniapp: {
      version: "1",
      name: "Builder Globe",
      homeUrl: URL,
      iconUrl: `${URL}/icon.png`,
      splashImageUrl: `${URL}/splash.png`,
      splashBackgroundColor: "#030712",
      webhookUrl: `${URL}/api/webhook`,
      subtitle: "Explore builders worldwide",
      description: "Discover talented builders globally with Talent Protocol. View statistics, rankings, and ecosystem participation on an interactive 3D globe.",
      screenshotUrls: [
        `${URL}/screenshot-1.png`,
        `${URL}/screenshot-2.png`,
        `${URL}/screenshot-3.png`
      ],
      primaryCategory: "social",
      tags: ["builders", "talent", "globe", "visualization", "base"],
      heroImageUrl: `${URL}/hero.png`,
      tagline: "Discover builders worldwide",
      ogTitle: "Builder Globe",
      ogDescription: "Explore talented builders around the world on an interactive 3D globe",
      ogImageUrl: `${URL}/og-image.png`,
      noindex: false
    }
  };

  return Response.json(manifest);
}
