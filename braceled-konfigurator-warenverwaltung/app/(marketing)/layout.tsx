import type { Metadata } from "next"
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google"
import { LandingNav } from "@/components/landing/landing-nav"
import "./landing.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-landing-display",
  weight: ["600", "700", "800"],
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-landing-body",
  weight: ["400", "500", "600", "700"],
})

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://braceled-led-armband.com"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "BraceLED – Next Level LED Armband für Events",
  description:
    "Leuchtende Event-Armbänder – ferngesteuert per DMX, App oder Fernbedienung. German Engineering, Versand aus Deutschland.",
  keywords: [
    "LED Armbänder",
    "Event Armbänder",
    "LED Eventarmbänder",
    "BraceLED",
    "DMX Armband",
    "Festival Armbänder",
  ],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-light-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    url: siteUrl,
    siteName: "BraceLED",
    locale: "de_DE",
    type: "website",
    title: "BraceLED – Next Level LED Armband für Events",
    description:
      "Leuchtende Event-Armbänder für Festivals, Corporate Events und Produktionen – konfigurierbar mit Live-Preisberechnung.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BraceLED – Next Level LED Armband für Events",
    description:
      "Leuchtende Event-Armbänder für Festivals, Corporate Events und Produktionen – konfigurierbar mit Live-Preisberechnung.",
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${jakarta.variable} ${dmSans.variable} landing-theme`}>
      <div className="landing-root">
        <a href="#hauptinhalt" className="lp-skip-link">
          Zum Hauptinhalt springen
        </a>
        <LandingNav />
        {children}
      </div>
    </div>
  )
}
