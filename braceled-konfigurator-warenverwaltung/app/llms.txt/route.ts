import { GEO_PRODUCT_PATH } from "@/lib/landing/geo-product"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://braceled-led-armband.com"

export function GET() {
  const body = `# BraceLED

> Ferngesteuerte LED-Eventarmbänder (Miete & Kauf) für Festivals, Corporate Events, Messen und Produktionen. B2B, Versand aus Deutschland.

## Primäre Seiten

- [LED Armbänder für Events – Produkt & Specs](${siteUrl}${GEO_PRODUCT_PATH}): Zitierbare Produktseite mit Technik, Preisen, Vergleich und FAQ
- [Start / BraceLED](${siteUrl}/): Marketing-Übersicht und Einstieg
- [Konfigurator](${siteUrl}/konfigurator): Live-Preisberechnung, Menge 100–4.000

## Fakten (Kurz)

- Marke: BraceLED (WIRKUNG digital)
- Steuerung: DMX, App oder Handcontroller
- Gruppen: bis 20
- Frequenz: 433/434 MHz (ISM DE/EU), Reichweite ca. 200 m
- Laufzeit: ca. 9 h (Sleep-Modus verlängert)
- Preise netto ab: Miete 3,90 €/Stk., Kauf 4,20 €/Stk. (ab 100 Stück)
- Region: Rhein-Main / Deutschland

## Rechtliches

- [Impressum](${siteUrl}/impressum)
- [Datenschutz](${siteUrl}/datenschutz)
- [AGB](${siteUrl}/agb)
`

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
