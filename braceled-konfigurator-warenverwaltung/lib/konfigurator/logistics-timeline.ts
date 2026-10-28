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

export type LogisticsMilestone = {
  id: string
  label: string
  date: Date | null
  dateLabel: string
  kind: "today" | "deadline" | "event" | "return"
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

/**
 * Kunden-Zeitstrahl für Produktion/Logistik (Werktage, ab Event rückwärts).
 * Ohne Eventdatum nur „Heute“.
 */
export function buildLogisticsTimeline(
  config: Pick<QuoteConfig, "von" | "bis" | "druck" | "lieferpaket" | "lieferzeit" | "lieferart" | "flexRueckgabe" | "flex">,
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
  const druckdatenBis = config.druck ? produktionStart : null
  const ruecksendungBis = addWorkdays(eventEnd, rueckWd)

  const push = (
    id: string,
    label: string,
    date: Date | null,
    kind: LogisticsMilestone["kind"],
  ) => {
    milestones.push({
      id,
      label,
      date,
      dateLabel: date ? formatDe(date) : "—",
      kind,
    })
  }

  push("beauftragung", "Beauftragung bis", beauftragungBis, "deadline")
  if (druckdatenBis) {
    push("druckdaten", "Druckdaten bis", druckdatenBis, "deadline")
  }
  push("produktion", "Produktion bis", produktionBis, "deadline")
  push("versand", "Versand bis", versand, "deadline")
  push("ankunft", "Ankunft am", ankunft, "deadline")
  push("event", "Event", event, "event")
  push("ruecksendung", "Rücksendung bis", ruecksendungBis, "return")

  return milestones
}
