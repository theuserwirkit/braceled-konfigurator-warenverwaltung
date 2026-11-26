/** Deutsches Eingabeformat („1.234,56“ oder „1,89“) → Zahl; leer → null; ungültig/negativ → NaN. */
export function parseBetragInput(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === "") return null
  const isThousandsOnly = /^\d{1,3}(\.\d{3})+$/.test(trimmed)
  const normalized =
    trimmed.includes(",") || isThousandsOnly ? trimmed.replace(/\./g, "").replace(",", ".") : trimmed
  if (!/^\d+(\.\d+)?$/.test(normalized)) return Number.NaN
  return Number(normalized)
}
