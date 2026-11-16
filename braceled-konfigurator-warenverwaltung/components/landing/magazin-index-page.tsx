import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Mail, MapPin } from "lucide-react"
import { AiGeneratedCaption } from "@/components/landing/ai-generated-caption"
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
import { GEO_EINSATZ_PATH } from "@/lib/landing/geo-einsatz"
import { GEO_PRODUCT_PATH } from "@/lib/landing/geo-product"
import {
  MAGAZIN_ARTICLES,
  MAGAZIN_HERO,
  MAGAZIN_PATH,
} from "@/lib/landing/magazin"
import { EMAIL_INFO } from "@/lib/contact-emails"

const NAV_LINKS = [
  { href: MAGAZIN_PATH, label: "Magazin" },
  { href: GEO_EINSATZ_PATH, label: "Einsatzideen" },
  { href: GEO_PRODUCT_PATH, label: "Produkt" },
  { href: "/led-armbaender-vergleich", label: "Vergleich" },
  { href: "/", label: "Start" },
] as const

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`))
}

export function MagazinIndexPage() {
  return (
    <div className="landing-root">
      <a href="#hauptinhalt" className="lp-skip-link">
        Zum Hauptinhalt springen
      </a>
      <LandingNav links={NAV_LINKS} />
      <main id="hauptinhalt">
        <Hero />
        <ArticleList />
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
          <p className="lp-hero-kicker">{MAGAZIN_HERO.kicker}</p>
          <h1 className="lp-hero-headline">{MAGAZIN_HERO.headline}</h1>
          <p className="lp-hero-subline">{MAGAZIN_HERO.lead}</p>
          <div className="lp-hero-cta-row">
            <LandingButton href="/konfigurator" size="lg">
              Paket konfigurieren <ArrowRight size={18} />
            </LandingButton>
            <LandingButton href="#artikel" variant="outline-white" size="lg">
              Zu den Artikeln
            </LandingButton>
          </div>
        </div>
        <div className="lp-hero-ref-visual">
          <figure className="lp-hero-image-frame lp-media-figure">
            <Image
              src={LANDING_IMAGES.bedruckt}
              alt="BraceLED Magazin – LED-Eventarmbänder in der Praxis"
              width={520}
              height={520}
              priority
              className="lp-hero-main-img"
            />
            <div className="lp-hero-image-ring" />
            <AiGeneratedCaption src={LANDING_IMAGES.bedruckt} />
          </figure>
        </div>
      </div>
    </section>
  )
}

function ArticleList() {
  return (
    <section id="artikel" className="lp-section">
      <div className="lp-container">
        <SectionHeader
          label="Artikel"
          title="8 Beiträge für Briefing und Show"
          subtitle="Miete vs. Kauf, Interaktion, Branding, Ablauf und Kurz-Technik – mit klaren CTAs in den Konfigurator."
        />
        <div className="magazin-grid">
          {MAGAZIN_ARTICLES.map((article, i) => (
            <LandingReveal key={article.slug} delay={i * 50}>
              <article className="magazin-card">
                <p className="magazin-card-meta">
                  <span>{article.kicker}</span>
                  <span aria-hidden>·</span>
                  <time dateTime={article.datePublished}>
                    {formatDate(article.datePublished)}
                  </time>
                  <span aria-hidden>·</span>
                  <span>{article.readingMinutes} Min.</span>
                </p>
                <h2>
                  <Link href={`${MAGAZIN_PATH}/${article.slug}`}>{article.title}</Link>
                </h2>
                <p>{article.description}</p>
                <Link href={`${MAGAZIN_PATH}/${article.slug}`} className="lp-tech-doc-link">
                  Artikel lesen <ArrowRight size={16} />
                </Link>
              </article>
            </LandingReveal>
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
            kicker="Praxis umsetzen"
            title={
              <>
                Live-Preis
                <br />
                <span className="lp-led-shimmer">im Konfigurator</span>
              </>
            }
            align="center"
            light
          />
          <p className="lp-final-sub">
            Menge, Gruppen, Druck und Lieferung – Angebot in wenigen Minuten.
          </p>
          <div className="lp-final-btns">
            <LandingButton href="/konfigurator" size="lg">
              Zum Konfigurator <ArrowRight size={18} />
            </LandingButton>
            <LandingButton href={GEO_EINSATZ_PATH} variant="outline-white" size="lg">
              Einsatzideen
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
            <Link href={MAGAZIN_PATH}>Magazin</Link>
            <Link href={GEO_EINSATZ_PATH}>Einsatzideen</Link>
            <Link href={GEO_PRODUCT_PATH}>Produkt</Link>
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
