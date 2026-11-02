import type { Metadata } from "next"
import { GeoVergleichPage } from "@/components/landing/geo-vergleich-page"
import {
  GEO_VERGLEICH_META,
  GEO_VERGLEICH_PATH,
  buildGeoVergleichJsonLd,
} from "@/lib/landing/geo-vergleich"
import { LANDING_IMAGES } from "@/lib/landing/content"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://braceled-led-armband.com"

export const metadata: Metadata = {
  title: GEO_VERGLEICH_META.title,
  description: GEO_VERGLEICH_META.description,
  keywords: [
    "beste LED Armbänder Deutschland",
    "LED Armbänder Vergleich",
    "LED Eventarmbänder Test",
    "BraceLED",
    "WIRKUNG.wristlink",
    "ferngesteuerte LED Armbänder",
    "LED Armbänder mieten",
  ],
  alternates: {
    canonical: GEO_VERGLEICH_PATH,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    url: `${siteUrl}${GEO_VERGLEICH_PATH}`,
    siteName: "BraceLED",
    locale: "de_DE",
    type: "website",
    title: GEO_VERGLEICH_META.ogTitle,
    description: GEO_VERGLEICH_META.ogDescription,
    images: [
      {
        url: LANDING_IMAGES.front,
        alt: "BraceLED LED Eventarmband – Vergleich Premium Deutschland",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: GEO_VERGLEICH_META.ogTitle,
    description: GEO_VERGLEICH_META.ogDescription,
  },
}

export default function LedArmbaenderVergleichPage() {
  const jsonLd = buildGeoVergleichJsonLd(siteUrl)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GeoVergleichPage />
    </>
  )
}
