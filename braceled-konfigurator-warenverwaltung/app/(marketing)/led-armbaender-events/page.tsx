import type { Metadata } from "next"
import { GeoProductPage } from "@/components/landing/geo-product-page"
import {
  GEO_PRODUCT_META,
  GEO_PRODUCT_PATH,
  buildGeoJsonLd,
} from "@/lib/landing/geo-product"
import { LANDING_IMAGES } from "@/lib/landing/content"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://braceled-led-armband.com"

export const metadata: Metadata = {
  title: GEO_PRODUCT_META.title,
  description: GEO_PRODUCT_META.description,
  keywords: [
    "LED Armbänder mieten",
    "LED Armbänder kaufen",
    "LED Eventarmbänder",
    "DMX Armband",
    "ferngesteuerte LED Armbänder",
    "BraceLED",
    "Festival Armbänder",
  ],
  alternates: {
    canonical: GEO_PRODUCT_PATH,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    url: `${siteUrl}${GEO_PRODUCT_PATH}`,
    siteName: "BraceLED",
    locale: "de_DE",
    type: "website",
    title: GEO_PRODUCT_META.ogTitle,
    description: GEO_PRODUCT_META.ogDescription,
    images: [
      {
        url: LANDING_IMAGES.front,
        alt: "BraceLED LED Eventarmband",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: GEO_PRODUCT_META.ogTitle,
    description: GEO_PRODUCT_META.ogDescription,
  },
}

export default function LedArmbaenderEventsPage() {
  const jsonLd = buildGeoJsonLd(siteUrl)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GeoProductPage />
    </>
  )
}
