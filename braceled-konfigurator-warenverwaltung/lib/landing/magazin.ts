import { LANDING_IMAGES } from "@/lib/landing/content"
import { GEO_EINSATZ_PATH } from "@/lib/landing/geo-einsatz"
import { GEO_PRODUCT_PATH } from "@/lib/landing/geo-product"

export const MAGAZIN_PATH = "/magazin"

export type MagazinSection = {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export type MagazinArticle = {
  slug: string
  title: string
  description: string
  datePublished: string
  dateModified: string
  readingMinutes: number
  kicker: string
  lead: string
  sections: MagazinSection[]
  relatedHref?: string
  relatedLabel?: string
}

export const MAGAZIN_META = {
  title: "Magazin: LED-Armbänder für Events | BraceLED",
  description:
    "Praxiswissen zu ferngesteuerten LED-Armbändern: Miete vs. Kauf, Abstimmungen, Branding, Lieferzeiten und Agentur-Workflows – mit Fokus BraceLED.",
  ogTitle: "BraceLED Magazin – LED-Eventarmbänder in der Praxis",
  ogDescription:
    "Kurze, zitierbare Artikel für Veranstalter und Agenturen: Entscheidung, Ablauf und Show-Ideen.",
} as const

export const MAGAZIN_HERO = {
  kicker: "Magazin · BraceLED",
  headline: "Praxiswissen für LED-Eventarmbänder",
  lead:
    "Keine Story-Sammlung – sondern Entscheidungshilfen und Abläufe für Agenturen und Veranstalter. Specs und Preise bleiben auf der Produktseite, Show-Ideen auf der Einsatzseite.",
} as const

export const MAGAZIN_ARTICLES: MagazinArticle[] = [
  {
    slug: "led-armbaender-mieten-oder-kaufen",
    title: "LED-Armbänder mieten oder kaufen?",
    description:
      "Wann sich Miete lohnt, wann Kauf – und wie BraceLED Preise, Rücknahme und Branding im B2B-Ablauf trennt.",
    datePublished: "2026-11-10",
    dateModified: "2026-11-10",
    readingMinutes: 5,
    kicker: "Entscheidung",
    lead:
      "Die meisten Anfragen starten mit derselben Frage: mieten oder kaufen? Die Antwort hängt von Wiederholung, Branding und Lagerlogistik ab – nicht vom Show-Effekt.",
    sections: [
      {
        heading: "Miete: wenn das Event einmalig ist",
        paragraphs: [
          "Bei Einzel-Events, Tourneen mit Rückgabe oder wenn Du keine Lagerfläche willst, ist Miete der saubere Weg. BraceLED Miete startet ab 3,90 € netto/Stück (ab 100 Stück) und inkludiert Reinigung sowie Rücknahme.",
          "Du behältst Fokus auf Show und Ausgabe – nicht auf Batteriewechsel Monate später.",
        ],
        bullets: [
          "Ideal für Festival, Kick-off, einmalige Gala",
          "Reinigung und Rücknahme inklusive",
          "Steuerung über Basis, Fernbedienung oder App",
        ],
      },
      {
        heading: "Kauf: wenn das Band Merch oder Inventar wird",
        paragraphs: [
          "Kauf ab 4,20 € netto/Stück lohnt sich, wenn Du wiederkehrende Events hast, Bänder als Giveaway behalten willst oder Branding-Druck fest zum Event gehört. Optional mit oder ohne Fernsteuerung.",
          "Bedruckte Kauf-Varianten (UV-Druck oder vollflächig) machen aus dem Armband ein Merch-Stück – das bleibt nach dem Event beim Gast oder im Firmenlager.",
        ],
      },
      {
        heading: "Schnell entscheiden im Konfigurator",
        paragraphs: [
          "Statt PDF-Angebote hin und her: Menge, Miete/Kauf, Gruppen, Druck und Lieferoption wählen – Live-Preis und Verfügbarkeit siehst Du direkt. Danach Angebot anfordern oder mit dem Team finalisieren.",
        ],
      },
    ],
    relatedHref: GEO_PRODUCT_PATH,
    relatedLabel: "Zu Specs & Preisen",
  },
  {
    slug: "abstimmungsmodus-led-armbaender",
    title: "Abstimmungsmodus: Meinung sichtbar machen ohne App-Chaos",
    description:
      "So funktioniert der Knopf-Abstimmungsmodus bei BraceLED – für Keynotes, Panels und interaktive Sessions.",
    datePublished: "2026-11-10",
    dateModified: "2026-11-10",
    readingMinutes: 4,
    kicker: "Interaktion",
    lead:
      "Abstimmungen scheitern oft an QR-Codes und App-Downloads. Mit BraceLED wählen Gäste per Knopfdruck eine Farbe – sichtbar für alle, steuerbar vom FOH.",
    sections: [
      {
        heading: "Was der Abstimmungsmodus macht",
        paragraphs: [
          "Teilnehmer drücken den Knopf am Armband und wechseln zwischen vordefinierten Farben. Das Publikum sieht sofort, welche Option dominiert – ohne Smartphone und ohne WLAN-Stau.",
        ],
      },
      {
        heading: "Wann er sich lohnt",
        paragraphs: [
          "Keynote-Meinungsbilder, Panel-Fragen, Charity-Votes oder Quiz-Runden. Besonders stark, wenn das Ergebnis Teil der Show sein soll – nicht nur eine Zahl auf einer Folie.",
        ],
        bullets: [
          "Keine App für Gäste nötig",
          "Sofort sichtbares Ergebnis in der Crowd",
          "Kombinierbar mit Gruppen für VIP vs. Saal",
        ],
      },
      {
        heading: "Planung im Ablauf",
        paragraphs: [
          "Lege vor dem Event fest, welche Farben welche Antwort bedeuten, und brief den Host. Technik schaltet in den Abstimmungsmodus, Host stellt die Frage, Crowd drückt – Cue zurück in die Show-Farbe.",
        ],
      },
    ],
    relatedHref: GEO_EINSATZ_PATH,
    relatedLabel: "Weitere Show-Ideen",
  },
  {
    slug: "branding-druck-led-armbaender",
    title: "Branding & Druck: wenn das Armband zur Markenfläche wird",
    description:
      "UV-Druck, Vollfläche und Corporate Colors – so planst Du Branding auf BraceLED Eventarmbändern.",
    datePublished: "2026-11-10",
    dateModified: "2026-11-10",
    readingMinutes: 5,
    kicker: "Branding",
    lead:
      "Passive Glow-Bänder tragen oft nur einen Aufkleber. BraceLED kann Logo und Claim direkt tragen – und parallel in Markenfarben gesteuert werden.",
    sections: [
      {
        heading: "Druckoptionen",
        paragraphs: [
          "Kleine Mengen bedrucken wir inhouse per UV-LED (typisch 2×3 cm, CMYK + Weiß). Größere Auflagen laufen über Druckpartner. Vollflächiger Druck auf fast der gesamten Vorderseite ist für Kauf-Merch der stärkste Look.",
        ],
      },
      {
        heading: "Lichtfarbe + Druck = doppeltes Branding",
        paragraphs: [
          "Druck bleibt auch im Hellen lesbar; Lichtfarbe wirkt in der Dunkelheit. Plane Corporate Colors als DMX-/Controller-Presets und den Druck als Tages-Branding – beides zusammen wirkt auf Fotos und in der Halle.",
        ],
      },
      {
        heading: "Vorlauf und Dateien",
        paragraphs: [
          "Logo als Vektordatei oder hochauflösendes PNG, Freisteller wo nötig. Setup-Pauschale einmalig; Probedruck auf Anfrage. Den genauen Aufpreis und Lieferweg siehst Du im Konfigurator.",
        ],
      },
    ],
    relatedHref: "/konfigurator",
    relatedLabel: "Druck im Konfigurator prüfen",
  },
  {
    slug: "einsatzideen-led-armbaender",
    title: "10 Wege, LED-Armbänder wirkungsvoll einzusetzen",
    description:
      "Kurzüberblick der stärksten Show-Ideen – von Laola bis Pausen-Timer – mit Link zur ausführlichen Einsatzseite.",
    datePublished: "2026-11-10",
    dateModified: "2026-11-10",
    readingMinutes: 4,
    kicker: "Überblick",
    lead:
      "Du brauchst keine 40 Effekte. Diese zehn Einsätze decken die meisten Briefings ab – und lassen sich mit bis zu 20 Gruppen skalieren.",
    sections: [
      {
        heading: "Die Kernideen auf einen Blick",
        paragraphs: [
          "Laola-Welle, Beifall-Cue, farbige Break-Outs, Gewinnspiel-Blinken, Branding-Zonen, Networking-Farben, Match-Making, Pausen-Timer – plus Abstimmung und Encore-Weißlicht. Jede Idee braucht klare Gruppen und einen Cue-Plan.",
        ],
        bullets: [
          "Show: Laola, Beifall, Encore",
          "Organisation: Break-Outs, Timer, Networking",
          "Interaktion: Abstimmung, Gewinnspiel, Match-Making",
          "Marke: Pixel-/Zonen-Branding",
        ],
      },
      {
        heading: "Ausführliche Abläufe",
        paragraphs: [
          "Die Einsatzideen-Seite beschreibt jede Show-Idee mit Zielgruppe und Ablauf sowie sechs Event-Segmente (Festival, Corporate, Kongress, Sport, Hochzeit/B2B, Messe). Von dort springst Du direkt in den Konfigurator.",
        ],
      },
    ],
    relatedHref: GEO_EINSATZ_PATH,
    relatedLabel: "Zur Einsatzideen-Seite",
  },
  {
    slug: "nachhaltigkeit-batterietausch-led-armbaender",
    title: "Nachhaltigkeit: wiederverwenden statt Einweg-Glow",
    description:
      "Warum tauschbare CR2032-Batterien und Miet-Rücknahme für Green Events zählen – und was Sleep-Modus bringt.",
    datePublished: "2026-11-10",
    dateModified: "2026-11-10",
    readingMinutes: 4,
    kicker: "Green Events",
    lead:
      "Viele Glow-Produkte sind Einweg. BraceLED setzt auf wiederverwendbare Armbänder, tauschbare Batterien und Miet-Rücknahme – damit die Show nicht auf dem Müll landet.",
    sections: [
      {
        heading: "Miete = Kreislauf",
        paragraphs: [
          "Gemietete Bänder kommen zurück, werden geprüft und erneut eingesetzt. Du zahlst für den Event-Nutzen, nicht für Wegwerf-Hardware.",
        ],
      },
      {
        heading: "Batterien und Laufzeit",
        paragraphs: [
          "Zwei CR2032, austauschbar. Laufzeit ca. 9 Stunden; Sleep-Modus verlängert die Nutzzeit, wenn Bänder nicht aktiv leuchten. Plastik-Laschen erst kurz vor der Show ziehen – dann startet die Uhr.",
        ],
      },
      {
        heading: "Was Du Agenturen sagen kannst",
        paragraphs: [
          "Wiederverwendbar, tauschbare Zellen, deutscher Versand und Rücknahme bei Miete – das lässt sich in Green-Event-Briefings konkret belegen, ohne Greenwashing-Floskeln.",
        ],
      },
    ],
    relatedHref: GEO_PRODUCT_PATH,
    relatedLabel: "Produkt & Specs",
  },
  {
    slug: "agentur-workflow-lieferzeiten",
    title: "Agentur-Workflow: von Briefing bis Ausgabe",
    description:
      "Praktischer Ablauf für Agenturen: Konfigurator, Verfügbarkeit, Overnight, Abholung Rhein-Main und Ausgabe an Gäste.",
    datePublished: "2026-11-10",
    dateModified: "2026-11-10",
    readingMinutes: 5,
    kicker: "Ablauf",
    lead:
      "Gute Shows scheitern selten an der Idee – eher am Vorlauf. So sieht ein realistischer BraceLED-Workflow von Anfrage bis Crowd aus.",
    sections: [
      {
        heading: "1. Briefing → Konfigurator",
        paragraphs: [
          "Eventdatum, Menge (100–4.000), Miete/Kauf, Gruppenanzahl, Druck ja/nein. Live-Preis und Lieferfenster prüfen, bevor das Angebot an den Kunden geht.",
        ],
      },
      {
        heading: "2. Lieferoptionen",
        paragraphs: [
          "Standard-Vorlauf liegt typischerweise bei wenigen Werktagen bis Wochen. Flex- und Overnight-Optionen (innerhalb 48 Stunden) decken Eilfälle ab. Abholung im Rhein-Main-Gebiet oft noch am Eventtag möglich – wenn Verfügbarkeit passt.",
        ],
      },
      {
        heading: "3. Ausgabe & Cue-Plan",
        paragraphs: [
          "Bänder nach Zone vorbereiten, Laschen timing-gerecht ziehen, Host und Licht briefen. Nach dem Event: Rückgabe bei Miete oder Merch-Übergabe bei Kauf.",
        ],
        bullets: [
          "Gruppenliste = Ausgabeplan",
          "FOH/Host kennen die Cue-Namen",
          "Pufferbatterien für lange Shows einplanen",
        ],
      },
    ],
    relatedHref: "/konfigurator",
    relatedLabel: "Jetzt konfigurieren",
  },
  {
    slug: "funk-ism-led-armbaender-kurz",
    title: "Funk & ISM kurz erklärt (ohne Tech-Doku-Ersatz)",
    description:
      "Was Veranstalter zu 433/434 MHz, Reichweite und deutscher Funkkonformität wissen müssen – Details bleiben in der Tech-Doku.",
    datePublished: "2026-11-10",
    dateModified: "2026-11-10",
    readingMinutes: 4,
    kicker: "Technik kurz",
    lead:
      "Ausschreibungen fragen nach Frequenz und Reichweite. Hier die BraceLED-Kurzfassung für Entscheider – die ausführliche DMX-Doku bleibt bewusst auf der Wristlink-Techseite.",
    sections: [
      {
        heading: "Die Fakten fürs Briefing",
        paragraphs: [
          "Sendefrequenz 433/434 MHz im zulässigen ISM-Band (DE/EU). Reichweite ca. 200 m bei freier Sicht; Repeater möglich. Steuerung per DMX, Handcontroller oder optional App an der Basis. Bis zu 20 Gruppen.",
        ],
      },
      {
        heading: "Was das für Venues heißt",
        paragraphs: [
          "Basis zentral (FOH/Bühne) platzieren, Sichtlinien beachten, bei großen Hallen Repeater einplanen. Parallelbetrieb mit anderen 433-MHz-Systemen (z. B. PerfectCue) kann stören – früh mit dem Venue klären.",
        ],
      },
      {
        heading: "Wo die Deep-Doku liegt",
        paragraphs: [
          "DMX-Kanalpläne, Controller-Belegung und Setup-Schritte findest Du in der Tech-Dokumentation auf led-leuchtarmbaender.com/techdoku. BraceLED verlinkt dorthin – wir spiegeln die Doku bewusst nicht 1:1.",
        ],
      },
    ],
    relatedHref: "https://www.led-leuchtarmbaender.com/techdoku",
    relatedLabel: "Zur Tech-Dokumentation",
  },
  {
    slug: "corporate-launch-gruppen",
    title: "Corporate Launch mit Gruppen: Countdown, Reveal, Aftershow",
    description:
      "Wie Du bis zu 20 Gruppen für Produktlaunches nutzt – von VIP-Zone bis Aftershow-Farbe.",
    datePublished: "2026-11-10",
    dateModified: "2026-11-10",
    readingMinutes: 5,
    kicker: "Corporate",
    lead:
      "Ein Launch braucht Dramaturgie. Mit BraceLED-Gruppen baust Du Countdown, Reveal und Networking als Licht-Kapitel – inkl. optionalem Druck-Branding.",
    sections: [
      {
        heading: "Gruppen-Storyboard",
        paragraphs: [
          "Beispiel: Gruppe 1 VIP, 2–4 Saal-Segmente, 5 Presse, 6 Stage-Crew. Vor dem Reveal gedämpfte Markenfarbe, im Moment X alle auf Launch-Farbe, danach Networking-Farben für Breakouts.",
        ],
      },
      {
        heading: "Reveal-Moment",
        paragraphs: [
          "Host oder Lichtkonsole triggert den Cue. Kombiniert mit Sound und Video wirkt die Crowd wie eine Erweiterung der Stage – ohne dass Gäste etwas tippen müssen.",
        ],
      },
      {
        heading: "Aftershow & Merch",
        paragraphs: [
          "Kauf-Bänder mit Druck bleiben als Giveaway. Miet-Bänder gehen zurück. Beides lässt sich im selben Konfigurator-Flow anfragen – wichtig für Agenturen mit gemischten Budgets.",
        ],
      },
    ],
    relatedHref: GEO_EINSATZ_PATH,
    relatedLabel: "Weitere Einsatzideen",
  },
]

export function getMagazinArticle(slug: string): MagazinArticle | undefined {
  return MAGAZIN_ARTICLES.find((a) => a.slug === slug)
}

export function getAllMagazinSlugs(): string[] {
  return MAGAZIN_ARTICLES.map((a) => a.slug)
}

export function buildMagazinIndexJsonLd(siteUrl: string) {
  const pageUrl = `${siteUrl}${MAGAZIN_PATH}`

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": pageUrl,
        url: pageUrl,
        name: MAGAZIN_META.title,
        description: MAGAZIN_META.description,
        inLanguage: "de-DE",
        isPartOf: { "@id": `${siteUrl}/#website` },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#liste`,
        name: "BraceLED Magazin-Artikel",
        numberOfItems: MAGAZIN_ARTICLES.length,
        itemListElement: MAGAZIN_ARTICLES.map((article, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${siteUrl}${MAGAZIN_PATH}/${article.slug}`,
          name: article.title,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Start", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Magazin", item: pageUrl },
        ],
      },
    ],
  }
}

export function buildMagazinArticleJsonLd(siteUrl: string, article: MagazinArticle) {
  const pageUrl = `${siteUrl}${MAGAZIN_PATH}/${article.slug}`
  const imageUrl = `${siteUrl}${LANDING_IMAGES.front}`

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": pageUrl,
        headline: article.title,
        description: article.description,
        datePublished: article.datePublished,
        dateModified: article.dateModified,
        inLanguage: "de-DE",
        image: imageUrl,
        author: {
          "@type": "Organization",
          name: "BraceLED",
          url: siteUrl,
        },
        publisher: {
          "@type": "Organization",
          name: "BraceLED",
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}${LANDING_IMAGES.logo}`,
          },
        },
        mainEntityOfPage: pageUrl,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Start", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Magazin", item: `${siteUrl}${MAGAZIN_PATH}` },
          { "@type": "ListItem", position: 3, name: article.title, item: pageUrl },
        ],
      },
    ],
  }
}
