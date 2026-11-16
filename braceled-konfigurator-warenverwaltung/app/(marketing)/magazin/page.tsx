import type { Metadata } from "next"
import { MagazinIndexPage } from "@/components/landing/magazin-index-page"
import {
  MAGAZIN_META,
  MAGAZIN_PATH,
  buildMagazinIndexJsonLd,
} from "@/lib/landing/magazin"
import { LANDING_IMAGES } from "@/lib/landing/content"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://braceled-led-armband.com"

export const metadata: Metadata = {
  title: MAGAZIN_META.title,
  description: MAGAZIN_META.description,
  keywords: [
    "LED Armbänder Magazin",
    "LED Armbänder mieten kaufen",
    "LED Armbänder Abstimmung",
    "LED Armbänder Branding",
    "BraceLED",
  ],
  alternates: {
    canonical: MAGAZIN_PATH,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    url: `${siteUrl}${MAGAZIN_PATH}`,
    siteName: "BraceLED",
    locale: "de_DE",
    type: "website",
    title: MAGAZIN_META.ogTitle,
    description: MAGAZIN_META.ogDescription,
    images: [
      {
        url: LANDING_IMAGES.bedruckt,
        alt: "BraceLED Magazin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: MAGAZIN_META.ogTitle,
    description: MAGAZIN_META.ogDescription,
  },
}

export default function MagazinPage() {
  const jsonLd = buildMagazinIndexJsonLd(siteUrl)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MagazinIndexPage />
    </>
  )
}
