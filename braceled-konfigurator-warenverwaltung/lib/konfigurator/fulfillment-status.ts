import type { FulfillmentStatus } from "@/lib/konfigurator/types"

export const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  angenommen: "Angenommen",
  vorbereitet: "Vorbereitet",
  verpackt: "Zusammengepackt",
  bedruckt: "Bedruckt",
  versand_beauftragt: "Versand beauftragt",
  versandt: "Versandt",
  ruecksendung_angekommen: "Rücksendung angekommen",
  zurueckgepackt: "Zurückgepackt",
}

/** Mit Druck: erst zusammengepackt, dann bedrucken. */
export const FULFILLMENT_STEPS: FulfillmentStatus[] = [
  "angenommen",
  "vorbereitet",
  "verpackt",
  "bedruckt",
  "versand_beauftragt",
  "versandt",
  "ruecksendung_angekommen",
  "zurueckgepackt",
]

export function fulfillmentTemplateKey(status: FulfillmentStatus): string {
  return `fulfillment_${status}`
}

/** Rücksendeschritte nur bei Miete; Kauf endet nach „versandt“. */
export function needsReturnFulfillment(modus: string | null | undefined): boolean {
  return modus === "miete"
}

export function getActiveFulfillmentSteps(
  hasDruck: boolean,
  needsReturn = true,
): FulfillmentStatus[] {
  let steps = hasDruck
    ? [...FULFILLMENT_STEPS]
    : FULFILLMENT_STEPS.filter((s) => s !== "bedruckt")
  if (!needsReturn) {
    steps = steps.filter(
      (s) => s !== "ruecksendung_angekommen" && s !== "zurueckgepackt",
    )
  }
  return steps
}

export function getNextFulfillmentStep(
  current: FulfillmentStatus | null | undefined,
  hasDruck: boolean,
  needsReturn = true,
): FulfillmentStatus | null {
  const steps = getActiveFulfillmentSteps(hasDruck, needsReturn)
  if (!current) return steps[0] ?? null
  const idx = steps.indexOf(current)
  if (idx < 0 || idx >= steps.length - 1) return null
  return steps[idx + 1]
}

export function isFulfillmentComplete(
  current: FulfillmentStatus | null | undefined,
  hasDruck: boolean,
  needsReturn = true,
): boolean {
  const steps = getActiveFulfillmentSteps(hasDruck, needsReturn)
  if (!current) return false
  return current === steps[steps.length - 1]
}
