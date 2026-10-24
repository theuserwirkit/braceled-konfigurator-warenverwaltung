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
import { LANDING_IMAGES } from "@/lib/landing/content"
import {
  GEO_ANSWER_BLOCK,
  GEO_COMPARISON,
  GEO_FAQ,
  GEO_HERO,
  GEO_PRICING_FACTS,
  GEO_PRODUCT_PATH,
  GEO_REVIEWS,
  GEO_SPECS,
  GEO_USE_CASES,
  formatGeoPrice,
} from "@/lib/landing/geo-product"
import { EMAIL_INFO } from "@/lib/contact-emails"

const GEO_NAV_LINKS = [
  { href: `${GEO_PRODUCT_PATH}#specs`, label: "Specs" },
  { href: `${GEO_PRODUCT_PATH}#vergleich`, label: "Vergleich" },
  { href: `${GEO_PRODUCT_PATH}#preise`, label: "Preise" },
  { href: `${GEO_PRODUCT_PATH}#faq`, label: "FAQ" },
  { href: "/", label: "Start" },
] as const

export function GeoProductPage() {
  return (
    <div className="landing-root">
      <a href="#hauptinhalt" className="lp-skip-link">
        Zum Hauptinhalt springen
      </a>
      <LandingNav links={GEO_NAV_LINKS} />
      <main id="hauptinhalt">
        <Hero />
        <AnswerSection />
        <SpecsSection />
        <UseCasesSection />
        <ComparisonSection />
        <PricingSection />
        <ReviewsSection />
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
          <p className="lp-hero-kicker">{GEO_HERO.kicker}</p>
          <h1 className="lp-hero-headline">{GEO_HERO.headline}</h1>
          <p className="lp-hero-subline">{GEO_HERO.lead}</p>
          <div className="lp-hero-cta-row">
            <LandingButton href="/konfigurator" size="lg">
              {GEO_HERO.ctaPrimary} <ArrowRight size={18} />
            </LandingButton>
            <LandingButton href="#specs" variant="outline-white" size="lg">
              {GEO_HERO.ctaSecondary}
            </LandingButton>
          </div>
        </div>
        <div className="lp-hero-ref-visual">
          <div className="lp-hero-image-frame">
            <Image
              src={LANDING_IMAGES.front}
              alt="BraceLED LED Eventarmband von vorne"
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
      <div className="lp-container lp-about-layout">
        <LandingReveal>
          <div className="lp-about-visual">
            <Image
              src={LANDING_IMAGES.tisch}
              alt="BraceLED LED-Armbänder auf dem Tisch"
              width={560}
              height={420}
              className="lp-about-img"
            />
          </div>
        </LandingReveal>
        <LandingReveal delay={100}>
          <div className="lp-prose">
            <FestivaTitle kicker="Kurz erklärt" title={GEO_ANSWER_BLOCK.title} />
            {GEO_ANSWER_BLOCK.paragraphs.map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
            <p>
              <strong>Einstiegspreis Miete:</strong> ab{" "}
              {formatGeoPrice(GEO_PRICING_FACTS[0].priceNetto)} netto pro Stück
              (100–4.000 Stück). Live-Preis im{" "}
              <Link href="/konfigurator">Konfigurator</Link>.
            </p>
          </div>
        </LandingReveal>
      </div>
    </section>
  )
}

function SpecsSection() {
  return (
    <section id="specs" className="lp-section lp-section-purple">
      <div className="lp-container">
        <SectionHeader
          label="Technik"
          title="Technische Spezifikationen"
          subtitle="Fakten für Planung, Ausschreibung und KI-Assistenten – servergerendert und aktuell."
        />
        <div className="lp-tech-specs">
          {GEO_SPECS.map((spec) => (
            <LandingReveal key={spec.label}>
              <div className="lp-tech-spec-card">
                <p className="lp-tech-spec-value">{spec.value}</p>
                <p className="lp-tech-spec-label">{spec.label}</p>
                <p className="lp-tech-spec-hint">{spec.hint}</p>
              </div>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function UseCasesSection() {
  return (
    <section className="lp-section">
      <div className="lp-container">
        <SectionHeader
          label="Einsatz"
          title="Für wen eignet sich BraceLED?"
          subtitle="Typische B2B-Szenarien, in denen ferngesteuerte LED-Armbänder den Unterschied machen."
        />
        <div className="geo-usecase-grid">
          {GEO_USE_CASES.map((item, i) => (
            <LandingReveal key={item.title} delay={i * 80}>
              <article className="geo-usecase-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function ComparisonSection() {
  return (
    <section id="vergleich" className="lp-section lp-section-purple">
      <div className="lp-container">
        <SectionHeader
          label="Orientierung"
          title={GEO_COMPARISON.title}
          subtitle={GEO_COMPARISON.intro}
        />
        <div className="geo-compare-wrap">
          <table className="geo-compare-table">
            <caption className="sr-only">
              Vergleich BraceLED, Glow-Bänder und App-only-Systeme
            </caption>
            <thead>
              <tr>
                <th scope="col">Aspekt</th>
                <th scope="col">BraceLED</th>
                <th scope="col">Passive Glow-Bänder</th>
                <th scope="col">App-only-Systeme</th>
              </tr>
            </thead>
            <tbody>
              {GEO_COMPARISON.rows.map((row) => (
                <tr key={row.aspect}>
                  <th scope="row">{row.aspect}</th>
                  <td>{row.braceled}</td>
                  <td>{row.glow}</td>
                  <td>{row.appOnly}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  return (
    <section id="preise" className="lp-section">
      <div className="lp-container">
        <SectionHeader
          label="Preise"
          title="Einstiegspreise netto (B2B)"
          subtitle="Keine Paketbindung: Menge, Steuerung, Druck und Lieferung konfigurierst Du live. Alle Angaben zzgl. MwSt."
        />
        <div className="lp-pricing-row">
          {GEO_PRICING_FACTS.map((tier, i) => (
            <LandingReveal key={tier.name} delay={i * 80}>
              <div className={`lp-price-tier ${i === 0 ? "featured" : ""}`}>
                {i === 0 && <span className="lp-tier-popular">Beliebt</span>}
                <div className="lp-tier-head">
                  <h3>{tier.name}</h3>
                </div>
                <div className="lp-tier-body">
                  <div className="lp-tier-price">
                    <span className="lp-tier-ab">ab</span>
                    <span className="lp-tier-amount">{formatGeoPrice(tier.priceNetto)}</span>
                    <span className="lp-tier-unit">/ Stk</span>
                  </div>
                  <p className="lp-tier-hint">{tier.hint}</p>
                  <ul>
                    {tier.points.map((point) => (
                      <li key={point}>
                        <Check size={16} /> {point}
                      </li>
                    ))}
                  </ul>
                  <LandingButton
                    href="/konfigurator"
                    className="lp-btn-block"
                    variant={i === 0 ? "primary" : "ghost"}
                  >
                    Konfigurieren
                  </LandingButton>
                </div>
              </div>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function ReviewsSection() {
  return (
    <section className="lp-section lp-section-purple">
      <div className="lp-container">
        <SectionHeader
          label="Referenzen"
          title="Was Event-Teams sagen"
          subtitle="Zitierbare Erfahrungsberichte aus Produktion und Medien."
        />
        <div className="lp-testimonial-grid">
          {GEO_REVIEWS.map((t, i) => (
            <LandingReveal key={t.author} delay={i * 100}>
              <blockquote className="lp-testimonial">
                <p>&ldquo;{t.quote}&rdquo;</p>
                <footer>
                  {t.author}
                  <span className="geo-review-meta">
                    {" "}
                    · {t.rating}/5 · {t.datePublished}
                  </span>
                </footer>
              </blockquote>
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
          title="Häufige Fragen zu LED-Eventarmbändern"
          subtitle="Antworten stehen vollständig im HTML – für Menschen und KI-Crawler."
        />
        <div className="geo-faq-list">
          {GEO_FAQ.map((item) => (
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
                Paket mit Live-Preis
                <br />
                <span className="lp-led-shimmer">konfigurieren</span>
              </>
            }
            align="center"
            light
          />
          <p className="lp-final-sub">
            Menge, Gruppen, Druck und Lieferung – in wenigen Minuten ein Angebot.
          </p>
          <div className="lp-final-btns">
            <LandingButton href="/konfigurator" size="lg">
              Zum Konfigurator <ArrowRight size={18} />
            </LandingButton>
            <LandingButton href={`mailto:${EMAIL_INFO}`} variant="outline-white" size="lg">
              <Mail size={18} /> Kontakt
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
            <Link href="/">Start</Link>
            <Link href="/impressum">Impressum</Link>
            <Link href="/datenschutz">Datenschutz</Link>
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
