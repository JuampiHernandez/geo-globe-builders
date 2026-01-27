export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL as string;
  
  const manifest = {
    accountAssociation: {
      // These will be generated using Base Build's Account association tool
      // Instructions: https://www.base.dev/preview?tab=account
      header: "",
      payload: "",
      signature: ""
    },
    miniapp: {
      version: "1",
      name: "Builder Globe",
      homeUrl: URL || "https://your-domain.com",
      iconUrl: `${URL || "https://your-domain.com"}/icon.png`,
      splashImageUrl: `${URL || "https://your-domain.com"}/splash.png`,
      splashBackgroundColor: "#030712",
      webhookUrl: `${URL || "https://your-domain.com"}/api/webhook`,
      subtitle: "Explore builders around the world",
      description: "Discover and explore talented builders from around the world with Talent Protocol. View builder statistics, rankings, and ecosystem participation on an interactive 3D globe.",
      screenshotUrls: [
        `${URL || "https://your-domain.com"}/screenshot-1.png`,
        `${URL || "https://your-domain.com"}/screenshot-2.png`,
        `${URL || "https://your-domain.com"}/screenshot-3.png`
      ],
      primaryCategory: "social",
      tags: ["builders", "talent", "globe", "visualization", "base"],
      heroImageUrl: `${URL || "https://your-domain.com"}/hero.png`,
      tagline: "Discover builders worldwide",
      ogTitle: "Builder Globe | Talent Protocol",
      ogDescription: "Explore talented builders around the world on an interactive 3D globe",
      ogImageUrl: `${URL || "https://your-domain.com"}/og-image.png`,
      noindex: false
    }
  };

  return Response.json(manifest);
}
