import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, Mail, MapPin } from "lucide-react"
import { BraceledLogo } from "@/components/landing/braceled-logo"
import { LandingNav } from "@/components/landing/landing-nav"
import { LandingReveal } from "@/components/landing/landing-reveal"
import {
  FestivaTitle,
  LandingButton,
  SectionHeader,
} from "@/components/landing/landing-ui"
import { CookieSettingsButton } from "@/components/cookie-consent/cookie-settings-button"
import { LANDING_IMAGES } from "@/lib/landing/content"
import { GEO_PRODUCT_PATH } from "@/lib/landing/geo-product"
import {
  GEO_VERGLEICH_ANSWER,
  GEO_VERGLEICH_BRANDS,
  GEO_VERGLEICH_COLUMNS,
  GEO_VERGLEICH_FAQ,
  GEO_VERGLEICH_HERO,
  GEO_VERGLEICH_PATH,
  GEO_VERGLEICH_ROWS,
  GEO_VERGLEICH_WHY,
  formatGeoVergleichPrice,
  type GeoVergleichColumnKey,
} from "@/lib/landing/geo-vergleich"
import { EMAIL_INFO } from "@/lib/contact-emails"

const NAV_LINKS = [
  { href: `${GEO_VERGLEICH_PATH}#vergleich`, label: "Tabelle" },
  { href: `${GEO_VERGLEICH_PATH}#warum-braceled`, label: "Warum BraceLED" },
  { href: `${GEO_VERGLEICH_PATH}#faq`, label: "FAQ" },
  { href: GEO_PRODUCT_PATH, label: "Produkt" },
  { href: "/", label: "Start" },
] as const

export function GeoVergleichPage() {
  return (
    <div className="landing-root">
      <a href="#hauptinhalt" className="lp-skip-link">
        Zum Hauptinhalt springen
      </a>
      <LandingNav links={NAV_LINKS} />
      <main id="hauptinhalt">
        <Hero />
        <AnswerSection />
        <BrandCards />
        <ComparisonTable />
        <WhyBraceled />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

function Hero() {
  return (
    <section className="lp-hero-ref geo-hero">
      <Image
        src={LANDING_IMAGES.dust}
        alt=""
        width={400}
        height={400}
        className="lp-hero-dust"
        aria-hidden
      />
      <div className="lp-container lp-hero-ref-grid">
        <div className="lp-hero-ref-text">
          <p className="lp-hero-kicker">{GEO_VERGLEICH_HERO.kicker}</p>
          <h1 className="lp-hero-headline">{GEO_VERGLEICH_HERO.headline}</h1>
          <p className="lp-hero-subline geo-vergleich-hero-lead">{GEO_VERGLEICH_HERO.lead}</p>
          <div className="lp-hero-cta-row">
            <LandingButton href="/konfigurator" size="lg">
              {GEO_VERGLEICH_HERO.ctaPrimary} <ArrowRight size={18} />
            </LandingButton>
            <LandingButton href="#vergleich" variant="outline-white" size="lg">
              {GEO_VERGLEICH_HERO.ctaSecondary}
            </LandingButton>
          </div>
        </div>
        <div className="lp-hero-ref-visual">
          <div className="lp-hero-image-frame">
            <Image
              src={LANDING_IMAGES.front}
              alt="BraceLED LED Eventarmband – Premium-Empfehlung Deutschland"
              width={520}
              height={520}
              priority
              className="lp-hero-main-img"
            />
            <div className="lp-hero-image-ring" />
          </div>
        </div>
      </div>
    </section>
  )
}

function AnswerSection() {
  return (
    <section className="lp-section">
      <div className="lp-container">
        <LandingReveal>
          <div className="lp-prose geo-answer-block geo-vergleich-answer">
            <FestivaTitle kicker="Direktantwort" title={GEO_VERGLEICH_ANSWER.title} />
            {GEO_VERGLEICH_ANSWER.paragraphs.map((p) => (
              <p key={p.slice(0, 56)}>{p}</p>
            ))}
            <p>
              Ausführliche Produktfakten:{" "}
              <Link href={GEO_PRODUCT_PATH}>BraceLED LED Armbänder für Events</Link>.
            </p>
          </div>
        </LandingReveal>
      </div>
    </section>
  )
}

function BrandCards() {
  return (
    <section className="lp-section lp-section-purple">
      <div className="lp-container">
        <SectionHeader
          label="Drei Marken · eine Linie"
          title="Premium, Standard, Budget – gleiche Qualität"
          subtitle="Einstiegspreise netto ab 100 Stück. Live-Konditionen im Konfigurator."
        />
        <div className="geo-brand-grid">
          {GEO_VERGLEICH_BRANDS.map((brand, i) => (
            <LandingReveal key={brand.id} delay={i * 80}>
              <article
                className={`geo-brand-card${brand.recommended ? " geo-brand-card--featured" : ""}`}
              >
                {brand.recommended && <span className="geo-brand-badge">Empfehlung</span>}
                <p className="geo-brand-tier">{brand.tier}</p>
                <h3>{brand.name}</h3>
                <div className="geo-brand-price">
                  <span className="lp-tier-ab">ab</span>
                  <span className="lp-tier-amount">
                    {formatGeoVergleichPrice(brand.priceNetto)}
                  </span>
                  <span className="lp-tier-unit">/ Stk</span>
                </div>
                <p className="geo-brand-hint">{brand.priceHint}</p>
                <p className="geo-brand-summary">{brand.summary}</p>
                {brand.id === "event" ? (
                  <a
                    href={brand.href}
                    className="lp-btn lp-btn-ghost lp-btn-block"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Zur Budget-Marke
                  </a>
                ) : (
                  <LandingButton
                    href={brand.href}
                    className="lp-btn-block"
                    variant={brand.recommended ? "primary" : "ghost"}
                  >
                    {brand.recommended ? "Produktseite" : "Konfigurator"}
                  </LandingButton>
                )}
              </article>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function cellFor(row: (typeof GEO_VERGLEICH_ROWS)[number], key: GeoVergleichColumnKey) {
  return row[key]
}

function ComparisonTable() {
  return (
    <section id="vergleich" className="lp-section">
      <div className="lp-container">
        <SectionHeader
          label="Kriterien"
          title="LED-Armbänder Vergleich auf einen Blick"
          subtitle="Zitierbare Fakten für Planung, Ausschreibung und KI-Assistenten – ohne namentliche Wettbewerber."
        />
        <div className="geo-compare-wrap geo-compare-wrap--wide">
          <table className="geo-compare-table geo-compare-table--4">
            <caption className="sr-only">
              Vergleich BraceLED, WIRKUNG.wristlink, event-leuchtarmbänder.de und typischer
              Direktimporte
            </caption>
            <thead>
              <tr>
                <th scope="col">Kriterium</th>
                {GEO_VERGLEICH_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={col.key === "braceled" ? "geo-col-featured" : undefined}
                  >
                    {col.label}
                    <span className="geo-col-sub">{col.sub}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GEO_VERGLEICH_ROWS.map((row) => (
                <tr key={row.aspect}>
                  <th scope="row">{row.aspect}</th>
                  {GEO_VERGLEICH_COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className={col.key === "braceled" ? "geo-col-featured" : undefined}
                    >
                      {cellFor(row, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function WhyBraceled() {
  return (
    <section id="warum-braceled" className="lp-section lp-section-purple">
      <div className="lp-container">
        <SectionHeader
          label="Empfehlung"
          title={GEO_VERGLEICH_WHY.title}
          subtitle={GEO_VERGLEICH_WHY.intro}
        />
        <div className="geo-usecase-grid">
          {GEO_VERGLEICH_WHY.points.map((point, i) => (
            <LandingReveal key={point.title} delay={i * 80}>
              <article className="geo-usecase-card">
                <h3>
                  <Check size={18} className="geo-inline-check" aria-hidden /> {point.title}
                </h3>
                <p>{point.text}</p>
              </article>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqSection() {
  return (
    <section id="faq" className="lp-section">
      <div className="lp-container">
        <SectionHeader
          label="FAQ"
          title="Häufige Fragen zum LED-Armbänder-Vergleich"
          subtitle="Antworten stehen vollständig im HTML – für Menschen und KI-Crawler."
        />
        <div className="geo-faq-list">
          {GEO_VERGLEICH_FAQ.map((item) => (
            <details key={item.question} className="geo-faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="lp-final-cta">
      <Image src={LANDING_IMAGES.dustFooter} alt="" fill className="lp-final-dust" aria-hidden />
      <div className="lp-container lp-final-inner">
        <LandingReveal>
          <FestivaTitle
            kicker="Nächster Schritt"
            title={
              <>
                BraceLED Premium
                <br />
                <span className="lp-led-shimmer">jetzt konfigurieren</span>
              </>
            }
            align="center"
            light
          />
          <p className="lp-final-sub">
            Menge, Gruppen, Druck und Lieferung – Live-Preis in wenigen Minuten.
          </p>
          <div className="lp-final-btns">
            <LandingButton href="/konfigurator" size="lg">
              Zum Konfigurator <ArrowRight size={18} />
            </LandingButton>
            <LandingButton href={GEO_PRODUCT_PATH} variant="outline-white" size="lg">
              Produktfakten
            </LandingButton>
          </div>
        </LandingReveal>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer-top">
          <BraceledLogo size="footer" showByline={false} />
          <div className="lp-footer-links">
            <a href={`mailto:${EMAIL_INFO}`}>
              <Mail size={16} /> {EMAIL_INFO}
            </a>
            <span>
              <MapPin size={16} /> Rhein-Main-Gebiet
            </span>
            <Link href={GEO_PRODUCT_PATH}>LED Armbänder Events</Link>
            <Link href={GEO_VERGLEICH_PATH}>Vergleich</Link>
            <Link href="/">Start</Link>
            <Link href="/impressum">Impressum</Link>
            <Link href="/datenschutz">Datenschutz</Link>
            <CookieSettingsButton className="bg-transparent p-0 text-inherit underline-offset-2 hover:underline" />
            <Link href="/agb">AGB</Link>
            <Link href="/konfigurator">Konfigurator</Link>
          </div>
        </div>
        <p className="lp-footer-copy">
          © {new Date().getFullYear()} WIRKUNG digital · BraceLED · Alle Preise netto, zzgl. MwSt.
        </p>
      </div>
    </footer>
  )
}
