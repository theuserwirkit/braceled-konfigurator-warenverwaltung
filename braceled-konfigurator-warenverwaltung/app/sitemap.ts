import type { MetadataRoute } from "next"

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://braceled-led-armband.com")
  .trim()
  .replace(/\/$/, "")

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/led-armbaender-events`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/led-armbaender-vergleich`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.94,
    },
    {
      url: `${siteUrl}/konfigurator`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/impressum`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/datenschutz`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/agb`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]
}
