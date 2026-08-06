export const VERSAND_DIENSTLEISTER_OPTIONS = [
  { value: "UPS", label: "UPS" },
  { value: "DHL", label: "DHL" },
  { value: "TNT", label: "TNT" },
  { value: "FedEx", label: "FedEx" },
] as const

export type VersandDienstleister = (typeof VERSAND_DIENSTLEISTER_OPTIONS)[number]["value"]

export function isVersandDienstleister(value: string): value is VersandDienstleister {
  return VERSAND_DIENSTLEISTER_OPTIONS.some((option) => option.value === value)
}

export function getVersandDienstleisterLabel(value: string | null | undefined): string {
  if (!value) return ""
  return VERSAND_DIENSTLEISTER_OPTIONS.find((option) => option.value === value)?.label ?? value
}

/** „UPS, DHL, TNT oder FedEx“ für Angebots-/Produkttexte. */
export function formatVersandCarrierPhrase(): string {
  const labels = VERSAND_DIENSTLEISTER_OPTIONS.map((option) => option.label)
  if (labels.length <= 1) return labels[0] ?? ""
  if (labels.length === 2) return `${labels[0]} oder ${labels[1]}`
  return `${labels.slice(0, -1).join(", ")} oder ${labels[labels.length - 1]}`
}
