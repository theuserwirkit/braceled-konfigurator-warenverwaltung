import type { MetadataRoute } from "next"
import { MAGAZIN_ARTICLES, MAGAZIN_PATH } from "@/lib/landing/magazin"

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://braceled-led-armband.com")
  .trim()
  .replace(/\/$/, "")

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const magazineEntries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}${MAGAZIN_PATH}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.88,
    },
    ...MAGAZIN_ARTICLES.map((article) => ({
      url: `${siteUrl}${MAGAZIN_PATH}/${article.slug}`,
      lastModified: new Date(article.dateModified),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ]

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
      url: `${siteUrl}/led-armbaender-einsatz`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.93,
    },
    ...magazineEntries,
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
