import {
  ANKUNFT_WERKTAGE_FLEX,
  ANKUNFT_WERKTAGE_STANDARD,
  PRODUKTION_WERKTAGE,
  VERSAND_WERKTAGE_EIL,
  VERSAND_WERKTAGE_STANDARD,
  minWerktageForPaket,
  normalizeFlexRueckgabe,
  normalizeLieferpaket,
} from "@/lib/konfigurator/lieferpaket"
import type { QuoteConfig } from "@/lib/konfigurator/types"
import { addDays, addWorkdays, subtractWorkdays } from "@/lib/utils/date"

export const RUECKVERSAND_WERKTAGE_STANDARD = 3
export const RUECKVERSAND_WERKTAGE_FLEX = 8

/** Wer ist am Zug / wem gehört die Phase */
export type LogisticsOwner = "wir" | "event" | "logistik"

export type LogisticsMilestone = {
  id: string
  label: string
  date: Date | null
  dateLabel: string
  kind: "today" | "deadline" | "event" | "return"
  owner?: LogisticsOwner
}

export type LogisticsJourneyPhase = {
  id: string
  label: string
  dateLabel: string
  date: Date | null
  owner: LogisticsOwner
  kind: LogisticsMilestone["kind"]
}

function parseDateOnly(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T12:00:00`)
}

function formatDe(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function startOfDay(d: Date): Date {
  return new Date(`${d.toISOString().slice(0, 10)}T12:00:00`)
}

function earlier(a: Date, b: Date): Date {
  return a.getTime() <= b.getTime() ? a : b
}

function later(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b
}

/**
 * Kunden-Zeitstrahl für Produktion/Logistik (Werktage, ab Event rückwärts).
 * Ohne Eventdatum nur „Heute“.
 */
export function buildLogisticsTimeline(
  config: Pick<
    QuoteConfig,
    "von" | "bis" | "druck" | "lieferpaket" | "lieferzeit" | "lieferart" | "flexRueckgabe" | "flex"
  >,
  from = new Date(),
): LogisticsMilestone[] {
  const today = startOfDay(from)
  const milestones: LogisticsMilestone[] = [
    {
      id: "heute",
      label: "Heute",
      date: today,
      dateLabel: formatDe(today),
      kind: "today",
    },
  ]

  if (!config.von) {
    return milestones
  }

  const event = parseDateOnly(config.von)
  const eventEnd = parseDateOnly(config.bis || config.von)
  const paket = normalizeLieferpaket(config)
  const flex = normalizeFlexRueckgabe(config)
  const ankunftWd = flex ? ANKUNFT_WERKTAGE_FLEX : ANKUNFT_WERKTAGE_STANDARD
  const transitWd = paket === "eil" ? VERSAND_WERKTAGE_EIL : VERSAND_WERKTAGE_STANDARD
  const produktionWd = PRODUKTION_WERKTAGE[paket]
  const rueckWd = flex ? RUECKVERSAND_WERKTAGE_FLEX : RUECKVERSAND_WERKTAGE_STANDARD

  const ankunft =
    paket === "eil" ? subtractWorkdays(event, 1) : subtractWorkdays(event, ankunftWd)
  const versand = subtractWorkdays(ankunft, transitWd)
  const produktionBis = versand
  const produktionStart =
    paket === "eil" ? addDays(versand, -2) : subtractWorkdays(versand, produktionWd)
  const beauftragungBis = subtractWorkdays(event, minWerktageForPaket(paket, flex))
  /** Zahlung parallel zur Beauftragung (gleicher Cut-off), sichtbar als eigener Schritt */
  const zahlungBis = beauftragungBis
  // Chronologie erzwingen: Beauftragung ≤ Druckdaten ≤ Freigabe ≤ Produktion
  const druckdatenBis = later(produktionStart, beauftragungBis)
  const freigabeCandidate =
    paket === "eil" ? addDays(druckdatenBis, 1) : addWorkdays(druckdatenBis, 2)
  const freigabeBis = later(druckdatenBis, earlier(freigabeCandidate, produktionBis))
  const rueckAufgabe = addWorkdays(eventEnd, 1)
  const ruecklieferungBis = addWorkdays(eventEnd, rueckWd)

  const push = (
    id: string,
    label: string,
    date: Date | null,
    kind: LogisticsMilestone["kind"],
    owner: LogisticsOwner,
  ) => {
    milestones.push({
      id,
      label,
      date,
      dateLabel: date ? formatDe(date) : "—",
      kind,
      owner,
    })
  }

  push("beauftragung", "Beauftragung", beauftragungBis, "deadline", "wir")
  push("zahlungseingang", "Zahlungseingang", zahlungBis, "deadline", "wir")
  push("druckdaten", "Druckdaten", druckdatenBis, "deadline", "wir")
  push("freigabe", "Freigabe Druck-Proof", freigabeBis, "deadline", "wir")
  push("produktion", "Produktion", produktionBis, "deadline", "wir")
  push("versand", "Versand", versand, "deadline", "logistik")
  push("ankunft", "Ankunft", ankunft, "deadline", "logistik")
  push("event", "Event", event, "event", "event")
  push("rueckAufgabe", "Aufgabe Rückversand", rueckAufgabe, "return", "logistik")
  push("ruecklieferung", "späteste Rücklieferung", ruecklieferungBis, "return", "logistik")

  return milestones
}

const JOURNEY_ORDER = [
  "beauftragung",
  "zahlungseingang",
  "druckdaten",
  "freigabe",
  "produktion",
  "versand",
  "ankunft",
  "event",
  "rueckAufgabe",
  "ruecklieferung",
] as const

export function buildLogisticsJourney(
  milestones: LogisticsMilestone[],
  _paket?: string,
): LogisticsJourneyPhase[] {
  const byId = new Map(milestones.map((m) => [m.id, m]))
  return JOURNEY_ORDER.flatMap((id) => {
    const m = byId.get(id)
    if (!m || !m.owner) return []
    return [
      {
        id: m.id,
        label: m.label,
        dateLabel: m.dateLabel,
        date: m.date,
        owner: m.owner,
        kind: m.kind,
      },
    ]
  })
}

/** Index der nächsten noch nicht abgeschlossenen Phase (0-basiert) */
export function activeJourneyPhaseIndex(
  phases: LogisticsJourneyPhase[],
  from = new Date(),
): number {
  const today = startOfDay(from).getTime()
  for (let i = 0; i < phases.length; i++) {
    const t = phases[i]?.date?.getTime()
    if (t == null || t >= today) return i
  }
  return Math.max(0, phases.length - 1)
}
