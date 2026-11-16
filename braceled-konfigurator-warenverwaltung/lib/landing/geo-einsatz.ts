import { LANDING_IMAGES } from "@/lib/landing/content"

/** GEO-/AEO-Einsatzideen: Show-Ideen & Event-Segmente für Kunden und Crawler. */

export const GEO_EINSATZ_PATH = "/led-armbaender-einsatz"

export const GEO_EINSATZ_META = {
  title: "LED-Armbänder Einsatzideen für Events | BraceLED",
  description:
    "8 Show-Ideen und 6 Event-Segmente für ferngesteuerte LED-Armbänder: Laola, Abstimmung, Networking, Pixel-Mapping und mehr – mit Konfigurator und Live-Preis.",
  ogTitle: "Einsatzideen für LED-Eventarmbänder – BraceLED",
  ogDescription:
    "Konkrete Abläufe für Festival, Corporate, Kongress und Sport: wie BraceLED die Crowd steuerbar macht.",
} as const

export const GEO_EINSATZ_HERO = {
  kicker: "Einsatzideen · BraceLED",
  headline: "Was Du mit LED-Armbändern auf Events wirklich machen kannst",
  lead:
    "BraceLED steuert bis zu 20 Gruppen per DMX, App oder Fernbedienung. Hier findest Du konkrete Show-Ideen und Event-Segmente – mit Fokus auf Ablauf, Agentur-Workflow und Live-Preis im Konfigurator.",
  ctaPrimary: "Paket konfigurieren",
  ctaSecondary: "Zu den Show-Ideen",
} as const

export const GEO_EINSATZ_ANSWER = {
  title: "Wofür eignen sich ferngesteuerte LED-Armbänder?",
  paragraphs: [
    "Ferngesteuerte LED-Armbänder machen aus dem Publikum ein steuerbares Lichtbild: synchrone Farben, Zonen, Abstimmungen und Interaktionen – ohne dass jeder Gast eine App braucht.",
    "BraceLED ist auf B2B-Events ausgelegt (ab 100 Stück, Miete oder Kauf). Typische Einsätze: Festival-Crowd, Corporate Launch, Kongress-Breakouts, Sport-Blöcke und Agentur-Hochzeiten. Mengen, Gruppen und Lieferung planst Du im Konfigurator mit Live-Preis.",
  ],
} as const

export const GEO_SHOW_IDEAS = [
  {
    id: "laola",
    title: "Laola-Welle mit Leuchtkraft",
    summary:
      "Tribünen oder Hallenbereiche nacheinander ansteuern – die Crowd wird zur Welle.",
    body: "Mit getrennten Gruppen (z. B. Block A–D) startest Du Farben zeitversetzt. Ideal für Arena, Festival-Mainstage und Sport. Profi-Tipp: DMX-Cue an den Beat legen, damit die Welle zur Musik „läuft“.",
    forWhom: "Festival, Konzert, Sport",
  },
  {
    id: "beifall",
    title: "Beifall mit Leucht-Effekt",
    summary:
      "Applaus-Momente sichtbar machen: bei Standing Ovations die ganze Halle aufhellen.",
    body: "Ein Cue für „alle weiß/warm“ oder Markenfarbe – ausgelöst vom FOH oder Host. Funktioniert besonders stark nach Keynotes, Award-Verleihungen und Encores.",
    forWhom: "Corporate, Konzert, Gala",
  },
  {
    id: "breakouts",
    title: "Farbenfrohe Break-Outs",
    summary:
      "Session-Räume und Tracks farblich markieren – Gäste finden ihre Gruppe sofort.",
    body: "Bis zu 20 Gruppen = bis zu 20 Tracks oder Tische. Am Morgen programmieren, am Nachmittag umschalten. Weniger Schilderchaos, klarere Wegeführung.",
    forWhom: "Kongress, Seminar, Kick-off",
  },
  {
    id: "gewinnspiel",
    title: "Blinkendes Gewinnspiel",
    summary:
      "Zufalls- oder Strobe-Effekt für den Gewinner – ohne App-Download.",
    body: "Eine Gruppe „blinkt“, der Rest bleibt dunkel oder gedimmt. Host zeigt auf den Bereich, Technik löst den Cue aus. Klassiker für Messe-Gewinnspiele und Aftershows.",
    forWhom: "Messe, Firmenfeier, Festival",
  },
  {
    id: "pixel-mapping",
    title: "Pixel-Mapping für's Branding",
    summary:
      "Bereiche in Corporate Colors oder Logo-ähnlichen Flächen leuchten lassen.",
    body: "Keine echte LED-Wand – aber mit Zonen und Farben entsteht ein lesbares Markenbild in der Crowd. Besonders stark bei Produktlaunches und Sponsor-Slots.",
    forWhom: "Corporate Launch, Sponsor-Activation",
  },
  {
    id: "networking",
    title: "Netzwerken mit Farbwechsel",
    summary:
      "Branche, Interesse oder Tischfarbe am Handgelenk – Networking ohne Namensschild-Chaos.",
    body: "Gäste mit gleicher Farbe finden sich schneller. Umschalten nach Session-Wechsel in Sekunden. Kombinierbar mit Druck-Branding auf dem Band.",
    forWhom: "Kongress, Messe, Community-Event",
  },
  {
    id: "matchmaking",
    title: "Match-Making mit Licht",
    summary:
      "Paare oder Teams „finden“ sich, wenn beide Farben übereinstimmen.",
    body: "Zwei Gruppen auf dieselbe Farbe setzen – oder per Knopf-Abstimmung Farbe wählen und Host matched. Gut für Teambuilding und Speed-Networking.",
    forWhom: "Teambuilding, HR-Event, Community",
  },
  {
    id: "timer",
    title: "Pausen-Timer",
    summary:
      "Pause endet → Armbänder wechseln Farbe oder blinken. Alle zurück in den Saal.",
    body: "Kein Durchsage-Spam: ein sichtbares Signal für die gesamte Crowd. Funktioniert indoor und outdoor, solange die Basis Reichweite hat.",
    forWhom: "Kongress, Workshop, Festival-Stage",
  },
] as const

export const GEO_EVENT_SEGMENTS = [
  {
    title: "Konzerte & Festivals",
    description:
      "Crowd als Teil der Show: synchrone Cues, VIP-/Floor-Gruppen und Encore-Momente. Mengen bis 4.000 Stück planbar, Miete inkl. Rücknahme.",
    points: [
      "DMX-Integration an der Lichtkonsole",
      "Zonen für Floor, VIP und Side-Stages",
      "Overnight-Lieferung bei knappen Vorläufen",
    ],
  },
  {
    title: "Corporate Events & Launches",
    description:
      "Markenfarben, Launch-Countdown und Teambuilding in einem System. Optional UV-Druck oder Vollflächendruck für Merch-Kauf.",
    points: [
      "Corporate Colors als feste Gruppenfarben",
      "Pixel-ähnliche Zonen für Logo-Momente",
      "Kauf oder Miete – Live-Preis im Konfigurator",
    ],
  },
  {
    title: "Kongresse & Seminare",
    description:
      "Breakouts, Abstimmungen und Networking ohne Extra-App. Farbwahl am Knopf für Live-Feedback.",
    points: [
      "Farbcodierte Sessions und Tracks",
      "Abstimmungsmodus für Meinungsbilder",
      "Pausen-Timer als sichtbares Signal",
    ],
  },
  {
    title: "Sportveranstaltungen",
    description:
      "Fan-Blöcke in Teamfarben, Highlight-Cues und Laola-Wellen. Robuste Ausgabe an große Mengen.",
    points: [
      "Blöcke als getrennte Gruppen",
      "Schnelle Cue-Reaktion auf Spielmomente",
      "Batterielaufzeit ca. 9 Stunden",
    ],
  },
  {
    title: "Hochzeiten & Privat-Events (B2B)",
    description:
      "Über Agenturen und Eventfirmen: Empfang, Trauung und Party mit abgestimmten Lichtgruppen – Verkauf/Vermietung an Unternehmen.",
    points: [
      "Sanfte Farbwechsel für Zeremonie",
      "Party-Modi für den Abend",
      "Branding optional für Gastgeschenk (Kauf)",
    ],
  },
  {
    title: "Messen & Open-Air",
    description:
      "Stand-Attraction, Gewinnspiel und Outdoor-Zonen. Repeater möglich bei großen Flächen.",
    points: [
      "Gewinnspiel- und Attention-Cues",
      "Reichweite ca. 200 m, Repeater optional",
      "Abholung Rhein-Main bei Eilbedarf",
    ],
  },
] as const

export const GEO_EINSATZ_FAQ = [
  {
    question: "Welche Show-Ideen funktionieren mit BraceLED am besten?",
    answer:
      "Besonders stark: Laola-Wellen, Beifall-Cues, farbige Break-Outs, Gewinnspiel-Blinken, Branding-Zonen, Networking-Farben, Match-Making und Pausen-Timer. Alle Ideen nutzen Gruppensteuerung – BraceLED kann bis zu 20 Gruppen getrennt ansteuern.",
  },
  {
    question: "Brauchen Gäste eine App für die Interaktion?",
    answer:
      "Nein. Die Armbänder werden zentral gesteuert (DMX, Handcontroller oder optional App an der Basis). Für Abstimmungen reicht der Knopf am Band – kein Download für Teilnehmer.",
  },
  {
    question: "Für welche Event-Typen eignen sich LED-Armbänder?",
    answer:
      "Für Festivals und Konzerte, Corporate Events und Launches, Kongresse und Seminare, Sport, Messen sowie Hochzeiten und Privat-Events über Agenturen (B2B). Mindestmenge 100 Stück.",
  },
  {
    question: "Kann ich die Ideen mieten oder nur kaufen?",
    answer:
      "Beides. Miete ab 3,90 € netto/Stück inkl. Reinigung und Rücknahme; Kauf ab 4,20 € netto/Stück. Mengen, Gruppen, Druck und Lieferung konfigurierst Du mit Live-Preis im Konfigurator.",
  },
  {
    question: "Wie plane ich Gruppen für Break-Outs oder Fan-Blöcke?",
    answer:
      "Lege im Konfigurator die gewünschte Gruppenanzahl fest und verteile die Bänder nach Zone oder Session. Pro DMX-Gruppe werden 4 Kanäle genutzt. Ausführliche DMX-Tabellen findest Du in der Tech-Dokumentation auf led-leuchtarmbaender.com/techdoku.",
  },
  {
    question: "Wie schnell kann ich für ein Event liefern lassen?",
    answer:
      "Overnight innerhalb von 48 Stunden ist möglich. Abholung im Rhein-Main-Gebiet oft noch am selben Tag. Den genauen Vorlauf siehst Du im Konfigurator nach Eventdatum und Verfügbarkeit.",
  },
] as const

export function buildGeoEinsatzJsonLd(siteUrl: string) {
  const pageUrl = `${siteUrl}${GEO_EINSATZ_PATH}`
  const imageUrl = `${siteUrl}${LANDING_IMAGES.gruppen}`

  const organization = {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "BraceLED",
    legalName: "WIRKUNG digital",
    url: siteUrl,
    logo: `${siteUrl}${LANDING_IMAGES.logo}`,
  }

  const webPage = {
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: GEO_EINSATZ_META.title,
    description: GEO_EINSATZ_META.description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    primaryImageOfPage: imageUrl,
    inLanguage: "de-DE",
  }

  const howTo = {
    "@type": "HowTo",
    "@id": `${pageUrl}#howto`,
    name: "LED-Armbänder auf Events einsetzen",
    description:
      "Typischer Ablauf: Gruppen planen, Armbänder ausgeben, Cues an der Basis oder Lichtkonsole auslösen.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Gruppen und Menge im Konfigurator festlegen",
        text: "Miete oder Kauf, Stückzahl und Gruppenanzahl wählen – Live-Preis und Lieferoptionen prüfen.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Bänder nach Zone oder Session verteilen",
        text: "VIP, Floor, Break-Out-Tracks oder Fan-Blöcke als getrennte Gruppen ausgeben.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Show-Ideen als Cues fahren",
        text: "Laola, Beifall, Timer oder Abstimmung per DMX, Handcontroller oder App auslösen.",
      },
    ],
  }

  const itemList = {
    "@type": "ItemList",
    "@id": `${pageUrl}#ideen`,
    name: "BraceLED Show-Ideen",
    numberOfItems: GEO_SHOW_IDEAS.length,
    itemListElement: GEO_SHOW_IDEAS.map((idea, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: idea.title,
      description: idea.summary,
    })),
  }

  const faqPage = {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: GEO_EINSATZ_FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Start",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Einsatzideen",
        item: pageUrl,
      },
    ],
  }

  return {
    "@context": "https://schema.org",
    "@graph": [organization, webPage, howTo, itemList, faqPage, breadcrumb],
  }
}
