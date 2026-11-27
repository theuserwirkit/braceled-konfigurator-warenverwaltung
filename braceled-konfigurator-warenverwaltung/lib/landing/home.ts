import { LANDING_ANSWER_BLOCK, LANDING_IMAGES } from "@/lib/landing/content"
import { GEO_PRODUCT_PRICES, GEO_PRODUCT_PATH } from "@/lib/landing/geo-product"

const HOME_META = {
  title: "BraceLED – Next Level LED Armband für Events",
  description:
    "Leuchtende Event-Armbänder – ferngesteuert per DMX, App oder Fernbedienung. German Engineering, Versand aus Deutschland.",
} as const

export function buildLandingHomeJsonLd(siteUrl: string) {
  const pageUrl = `${siteUrl}/`
  const imageUrl = `${siteUrl}${LANDING_IMAGES.hero}`
  const productUrl = `${siteUrl}${GEO_PRODUCT_PATH}`

  const organization = {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "BraceLED",
    legalName: "WIRKUNG digital",
    url: siteUrl,
    logo: `${siteUrl}${LANDING_IMAGES.logo}`,
    email: "info@wirkung-digital.de",
    areaServed: {
      "@type": "Country",
      name: "Germany",
    },
    address: {
      "@type": "PostalAddress",
      addressRegion: "Rhein-Main",
      addressCountry: "DE",
    },
  }

  const website = {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: "BraceLED",
    inLanguage: "de-DE",
    publisher: { "@id": `${siteUrl}/#organization` },
  }

  const product = {
    "@type": "Product",
    "@id": `${siteUrl}/#product`,
    name: "BraceLED LED Eventarmband",
    description: LANDING_ANSWER_BLOCK.paragraphs.join(" "),
    image: [
      imageUrl,
      `${siteUrl}${LANDING_IMAGES.tisch}`,
      `${siteUrl}${LANDING_IMAGES.front}`,
    ],
    brand: {
      "@type": "Brand",
      name: "BraceLED",
    },
    sku: "BRACELED-WRISTLINK",
    category: "LED Eventarmbänder",
    audience: {
      "@type": "BusinessAudience",
      audienceType: "B2B Eventveranstalter, Agenturen, Produktionen",
    },
    offers: {
      "@type": "AggregateOffer",
      url: `${siteUrl}/konfigurator`,
      priceCurrency: GEO_PRODUCT_PRICES.currency,
      lowPrice: GEO_PRODUCT_PRICES.mieteNetto.toFixed(2),
      highPrice: (
        GEO_PRODUCT_PRICES.kaufNetto + GEO_PRODUCT_PRICES.druckNetto
      ).toFixed(2),
      offerCount: 3,
      availability: "https://schema.org/InStock",
      priceValidUntil: "2027-12-31",
      seller: { "@id": `${siteUrl}/#organization` },
    },
    mainEntityOfPage: productUrl,
  }

  const webPage = {
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: HOME_META.title,
    description: HOME_META.description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#product` },
    primaryImageOfPage: imageUrl,
    inLanguage: "de-DE",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".geo-answer-block"],
    },
  }

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website, webPage, product],
  }
}
