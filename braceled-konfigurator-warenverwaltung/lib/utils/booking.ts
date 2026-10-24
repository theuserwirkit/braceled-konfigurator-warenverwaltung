import type { BookingType } from "@/lib/types"
import { addDays } from "@/lib/utils/date"

/** Default-Länge wenn nur Ausgabedatum gesetzt ist – analog Overlap-Logik offener Mietungen. */
export const MIETE_DEFAULT_DURATION_DAYS = 3

export type MieteBookingWindow =
  | { ok: true; ausgabe: Date; rueckgabe: Date }
  | { ok: false; error: string }

/**
 * Kanonisches Miet-Fenster für Write-Checks (gleiche Semantik wie Ampel-Overlaps):
 * Ausgabedatum Pflicht; fehlende Rückgabe → Ausgabe + 3 Tage.
 */
export function resolveMieteBookingWindow(input: {
  datumAusgabe?: Date | null
  datumRueckgabeGeplant?: Date | null
}): MieteBookingWindow {
  if (!input.datumAusgabe) {
    return { ok: false, error: "Mietbuchung braucht ein Ausgabedatum" }
  }
  const ausgabe = input.datumAusgabe
  const rueckgabe = input.datumRueckgabeGeplant ?? addDays(ausgabe, MIETE_DEFAULT_DURATION_DAYS)
  return { ok: true, ausgabe, rueckgabe }
}

export function getBookingTypeLabel(type: BookingType): string {
  const labels: Record<BookingType, string> = {
    ZUGANG: "Zugang",
    MIETE_AUSGABE: "Miete - Ausgabe",
    MIETE_RUECKGABE: "Miete - Rückgabe",
    VERKAUF: "Verkauf",
  }
  return labels[type]
}

export function getBookingTypeColor(type: BookingType): string {
  const colors: Record<BookingType, string> = {
    ZUGANG: "bg-chart-4 text-chart-4-foreground",
    MIETE_AUSGABE: "bg-chart-2 text-chart-2-foreground",
    MIETE_RUECKGABE: "bg-chart-3 text-chart-3-foreground",
    VERKAUF: "bg-chart-1 text-chart-1-foreground",
  }
  return colors[type]
}

// Shared stock calculation helper -- used by multiple availability functions
export function computeStockFromItems(
  items: Array<{ anzahl?: number; anzahl_fehlt?: number; anzahl_basen?: number; booking_type: string }>,
  mode: "bands" | "bases" = "bands",
): { totalZugang: number; totalVerkauft: number; totalDefekt: number; totalStock: number } {
  let totalZugang = 0
  let totalVerkauft = 0
  let totalDefekt = 0

  for (const item of items) {
    const anzahl =
      mode === "bases"
        ? (item.anzahl_basen != null ? item.anzahl_basen : (item.anzahl || 0))
        : (item.anzahl || 0)

    switch (item.booking_type) {
      case "ZUGANG":
        totalZugang += anzahl
        break
      case "VERKAUF":
        totalVerkauft += anzahl
        break
      case "MIETE_RUECKGABE":
        totalDefekt += item.anzahl_fehlt || 0
        break
    }
  }

  return {
    totalZugang,
    totalVerkauft,
    totalDefekt,
    totalStock: totalZugang - totalVerkauft - totalDefekt,
  }
}
