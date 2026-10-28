import { usesArmbandLager } from "@/lib/konfigurator/product-info"

export const KANALANZAHL_OPTIONS = [40, 80] as const
export type Kanalanzahl = (typeof KANALANZAHL_OPTIONS)[number]

/** Max. physikalische Lagergruppen (PGs) pro Anfragegruppe (AG) */
export const MAX_PHYSICAL_GROUPS = 3

export function isKanalanzahl(value: unknown): value is Kanalanzahl {
  return value === 40 || value === 80
}

export function normalizeKanalanzahl(value: unknown, fallback: Kanalanzahl = 40): Kanalanzahl {
  return isKanalanzahl(value) ? value : fallback
}

/** Kanalanzahl für Soft-Hold / Lager (Textilband immer 40; sonst Armband-Logik) */
export function resolveLagerKanalanzahl(
  produkt: string,
  kanalanzahl?: unknown,
): Kanalanzahl | undefined {
  if (!usesArmbandLager(produkt)) return undefined
  if (produkt === "textilband") return 40
  return normalizeKanalanzahl(kanalanzahl)
}

export function formatKanalanzahl(value: number): string {
  return `${value} CH`
}

export function formatStationMitKanal(stationLabel: string, kanalanzahl: number): string {
  return `${stationLabel} (${formatKanalanzahl(kanalanzahl)})`
}
