export const REJECTION_REASONS = [
  {
    id: "nicht_lieferbar",
    label: "Nicht lieferbar",
    message:
      "Deine gewünschte Konfiguration ist im angefragten Zeitraum bzw. in der gewünschten Menge aktuell nicht lieferbar. Wir finden aber oft eine passende Alternative – melde dich gern bei uns.",
  },
  {
    id: "zeitraum_belegt",
    label: "Zeitraum nicht verfügbar",
    message:
      "Der gewünschte Mietzeitraum ist leider bereits belegt. Schreib uns gern, welche Alternativtermine für dich infrage kommen – wir prüfen das schnell.",
  },
  {
    id: "konfiguration_unmoeglich",
    label: "Konfiguration nicht umsetzbar",
    message:
      "Die gewählte Kombination aus Optionen lässt sich so technisch oder organisatorisch nicht umsetzen. Gemeinsam finden wir in der Regel eine gute Lösung.",
  },
] as const

export type RejectionReasonId = (typeof REJECTION_REASONS)[number]["id"]

export function getRejectionReasonById(id: string) {
  return REJECTION_REASONS.find((r) => r.id === id)
}

export function getRejectionMessage(id: string): string {
  return getRejectionReasonById(id)?.message ?? REJECTION_REASONS[0].message
}
