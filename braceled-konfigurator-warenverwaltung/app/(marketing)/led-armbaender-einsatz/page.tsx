import type { Metadata } from "next"
import { GeoEinsatzPage } from "@/components/landing/geo-einsatz-page"
import {
  GEO_EINSATZ_META,
  GEO_EINSATZ_PATH,
  buildGeoEinsatzJsonLd,
} from "@/lib/landing/geo-einsatz"
import { LANDING_IMAGES } from "@/lib/landing/content"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://braceled-led-armband.com"

export const metadata: Metadata = {
  title: GEO_EINSATZ_META.title,
  description: GEO_EINSATZ_META.description,
  keywords: [
    "LED Armbänder Einsatzideen",
    "LED Armbänder Event Ideen",
    "LED Armbänder Abstimmung",
    "LED Armbänder Networking",
    "ferngesteuerte LED Armbänder Show",
    "BraceLED",
  ],
  alternates: {
    canonical: GEO_EINSATZ_PATH,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    url: `${siteUrl}${GEO_EINSATZ_PATH}`,
    siteName: "BraceLED",
    locale: "de_DE",
    type: "website",
    title: GEO_EINSATZ_META.ogTitle,
    description: GEO_EINSATZ_META.ogDescription,
    images: [
      {
        url: LANDING_IMAGES.gruppen,
        alt: "BraceLED LED-Armbänder Einsatz auf Events",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: GEO_EINSATZ_META.ogTitle,
    description: GEO_EINSATZ_META.ogDescription,
  },
}

export default function LedArmbaenderEinsatzPage() {
  const jsonLd = buildGeoEinsatzJsonLd(siteUrl)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GeoEinsatzPage />
    </>
  )
}
