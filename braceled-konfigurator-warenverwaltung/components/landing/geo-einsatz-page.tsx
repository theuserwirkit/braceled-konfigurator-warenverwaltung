import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, Mail, MapPin } from "lucide-react"
import { AiGeneratedCaption } from "@/components/landing/ai-generated-caption"
import { BraceledLogo } from "@/components/landing/braceled-logo"
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
  GEO_EINSATZ_ANSWER,
  GEO_EINSATZ_FAQ,
  GEO_EINSATZ_HERO,
  GEO_EINSATZ_PATH,
  GEO_EVENT_SEGMENTS,
  GEO_SHOW_IDEAS,
} from "@/lib/landing/geo-einsatz"
import { MAGAZIN_PATH } from "@/lib/landing/magazin"
import { EMAIL_INFO } from "@/lib/contact-emails"

export function GeoEinsatzPage() {
  return (
    <>
      <main id="hauptinhalt">
        <Hero />
        <AnswerSection />
        <IdeasSection />
        <SegmentsSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </>
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
          <p className="lp-hero-kicker">{GEO_EINSATZ_HERO.kicker}</p>
          <h1 className="lp-hero-headline">{GEO_EINSATZ_HERO.headline}</h1>
          <p className="lp-hero-subline">{GEO_EINSATZ_HERO.lead}</p>
          <div className="lp-hero-cta-row">
            <LandingButton href="/konfigurator" size="lg">
              {GEO_EINSATZ_HERO.ctaPrimary} <ArrowRight size={18} />
            </LandingButton>
            <LandingButton href="#ideen" variant="outline-white" size="lg">
              {GEO_EINSATZ_HERO.ctaSecondary}
            </LandingButton>
          </div>
        </div>
        <div className="lp-hero-ref-visual">
          <figure className="lp-hero-image-frame lp-media-figure">
            <Image
              src={LANDING_IMAGES.gruppen}
              alt="BraceLED LED-Armbänder in Gruppen – Einsatz auf Events"
              width={520}
              height={520}
              priority
              className="lp-hero-main-img"
            />
            <div className="lp-hero-image-ring" />
            <AiGeneratedCaption src={LANDING_IMAGES.gruppen} />
          </figure>
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
          <div className="lp-prose geo-vergleich-answer">
            <FestivaTitle kicker="Kurz erklärt" title={GEO_EINSATZ_ANSWER.title} />
            {GEO_EINSATZ_ANSWER.paragraphs.map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
            <p>
              Produkt-Specs und Preise:{" "}
              <Link href={GEO_PRODUCT_PATH}>LED Armbänder für Events</Link>. Live-Angebot:{" "}
              <Link href="/konfigurator">Konfigurator</Link>.
            </p>
          </div>
        </LandingReveal>
      </div>
    </section>
  )
}

function IdeasSection() {
  return (
    <section id="ideen" className="lp-section lp-section-purple">
      <div className="lp-container">
        <SectionHeader
          label="Show-Ideen"
          title="8 Einsätze, die Gäste wirklich spüren"
          subtitle="Konkrete Abläufe für Agenturen und Veranstalter – steuerbar in bis zu 20 Gruppen."
        />
        <div className="geo-faq-list geo-idea-list">
          {GEO_SHOW_IDEAS.map((idea) => (
            <details key={idea.id} className="geo-faq-item" id={idea.id}>
              <summary>{idea.title}</summary>
              <p className="geo-idea-summary">{idea.summary}</p>
              <p>{idea.body}</p>
              <p className="geo-idea-meta">
                Gut für: {idea.forWhom}
              </p>
            </details>
          ))}
        </div>
        <div className="lp-tech-doc-row" style={{ marginTop: "1.75rem" }}>
          <LandingButton href="/konfigurator" size="sm">
            Idee im Konfigurator planen <ArrowRight size={16} />
          </LandingButton>
        </div>
      </div>
    </section>
  )
}

function SegmentsSection() {
  return (
    <section id="events" className="lp-section">
      <div className="lp-container">
        <SectionHeader
          label="Event-Typen"
          title="Für jedes Format die passende Lichtrolle"
          subtitle="Von Arena bis Workshop – BraceLED bleibt bei Armbändern und B2B-Ablauf."
        />
        <div className="geo-usecase-grid">
          {GEO_EVENT_SEGMENTS.map((segment, i) => (
            <LandingReveal key={segment.title} delay={i * 70}>
              <article className="geo-usecase-card">
                <h3>{segment.title}</h3>
                <p>{segment.description}</p>
                <ul className="geo-idea-points">
                  {segment.points.map((point) => (
                    <li key={point}>
                      <Check size={16} aria-hidden />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
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
    <section id="faq" className="lp-section lp-section-purple">
      <div className="lp-container">
        <SectionHeader
          label="FAQ"
          title="Fragen zu Einsatz und Ablauf"
          subtitle="Antworten stehen vollständig im HTML – für Menschen und KI-Crawler."
        />
        <div className="geo-faq-list">
          {GEO_EINSATZ_FAQ.map((item) => (
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
                Menge & Gruppen
                <br />
                <span className="lp-led-shimmer">jetzt konfigurieren</span>
              </>
            }
            align="center"
            light
          />
          <p className="lp-final-sub">
            Live-Preis für Miete oder Kauf – ab 100 Stück, Versand aus Deutschland.
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
            <Link href={GEO_EINSATZ_PATH}>Einsatzideen</Link>
            <Link href={MAGAZIN_PATH}>Magazin</Link>
            <Link href={GEO_PRODUCT_PATH}>LED Armbänder Events</Link>
            <Link href="/led-armbaender-vergleich">Vergleich</Link>
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
