import { LandingPage } from "@/components/landing/landing-page"
import { buildLandingHomeJsonLd } from "@/lib/landing/home"
import { getLandingPricing } from "@/lib/landing/pricing"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://braceled-led-armband.com"

export default function LandingPageRoute() {
  const pricing = getLandingPricing()
  const jsonLd = buildLandingHomeJsonLd(siteUrl)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage pricing={pricing} />
    </>
  )
}
