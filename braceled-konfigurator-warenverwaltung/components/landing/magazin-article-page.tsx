import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Mail, MapPin } from "lucide-react"
import { BraceledLogo } from "@/components/landing/braceled-logo"
import { LandingNav } from "@/components/landing/landing-nav"
import { LandingReveal } from "@/components/landing/landing-reveal"
import { FestivaTitle, LandingButton } from "@/components/landing/landing-ui"
import { CookieSettingsButton } from "@/components/cookie-consent/cookie-settings-button"
import { LANDING_IMAGES } from "@/lib/landing/content"
import { GEO_EINSATZ_PATH } from "@/lib/landing/geo-einsatz"
import { GEO_PRODUCT_PATH } from "@/lib/landing/geo-product"
import {
  MAGAZIN_ARTICLES,
  MAGAZIN_PATH,
  type MagazinArticle,
} from "@/lib/landing/magazin"
import { EMAIL_INFO } from "@/lib/contact-emails"

const NAV_LINKS = [
  { href: MAGAZIN_PATH, label: "Magazin" },
  { href: GEO_EINSATZ_PATH, label: "Einsatzideen" },
  { href: GEO_PRODUCT_PATH, label: "Produkt" },
  { href: "/konfigurator", label: "Konfigurator" },
  { href: "/", label: "Start" },
] as const

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`))
}

function isExternal(href: string) {
  return href.startsWith("http://") || href.startsWith("https://")
}

export function MagazinArticlePage({ article }: { article: MagazinArticle }) {
  const others = MAGAZIN_ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3)

  return (
    <div className="landing-root">
      <a href="#hauptinhalt" className="lp-skip-link">
        Zum Hauptinhalt springen
      </a>
      <LandingNav links={NAV_LINKS} />
      <main id="hauptinhalt">
        <ArticleHero article={article} />
        <ArticleBody article={article} />
        <Related others={others} />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

function ArticleHero({ article }: { article: MagazinArticle }) {
  return (
    <section className="lp-section magazin-article-hero">
      <div className="lp-container magazin-article-wrap">
        <p className="lp-hero-kicker">{article.kicker}</p>
        <h1 className="lp-hero-headline magazin-article-title">{article.title}</h1>
        <p className="lp-hero-subline">{article.lead}</p>
        <p className="magazin-card-meta">
          <time dateTime={article.datePublished}>{formatDate(article.datePublished)}</time>
          <span aria-hidden>·</span>
          <span>{article.readingMinutes} Min. Lesezeit</span>
          <span aria-hidden>·</span>
          <Link href={MAGAZIN_PATH}>Alle Artikel</Link>
        </p>
      </div>
    </section>
  )
}

function ArticleBody({ article }: { article: MagazinArticle }) {
  const relatedIsExternal = article.relatedHref ? isExternal(article.relatedHref) : false

  return (
    <section className="lp-section lp-section-purple">
      <div className="lp-container magazin-article-wrap">
        <LandingReveal>
          <div className="magazin-prose">
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 56)}>{p}</p>
                ))}
                {section.bullets && section.bullets.length > 0 ? (
                  <ul>
                    {section.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            {article.relatedHref && article.relatedLabel ? (
              <p className="magazin-related-cta">
                {relatedIsExternal ? (
                  <a
                    href={article.relatedHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lp-tech-doc-link"
                  >
                    {article.relatedLabel} <ArrowRight size={16} />
                  </a>
                ) : (
                  <Link href={article.relatedHref} className="lp-tech-doc-link">
                    {article.relatedLabel} <ArrowRight size={16} />
                  </Link>
                )}
              </p>
            ) : null}
          </div>
        </LandingReveal>
      </div>
    </section>
  )
}

function Related({ others }: { others: MagazinArticle[] }) {
  if (others.length === 0) return null

  return (
    <section className="lp-section">
      <div className="lp-container">
        <h2 className="magazin-related-heading">Weitere Artikel</h2>
        <div className="magazin-grid magazin-grid--compact">
          {others.map((article) => (
            <article key={article.slug} className="magazin-card">
              <p className="magazin-card-meta">
                <span>{article.kicker}</span>
                <span aria-hidden>·</span>
                <span>{article.readingMinutes} Min.</span>
              </p>
              <h3>
                <Link href={`${MAGAZIN_PATH}/${article.slug}`}>{article.title}</Link>
              </h3>
              <p>{article.description}</p>
            </article>
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
                Angebot mit
                <br />
                <span className="lp-led-shimmer">Live-Preis</span>
              </>
            }
            align="center"
            light
          />
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
