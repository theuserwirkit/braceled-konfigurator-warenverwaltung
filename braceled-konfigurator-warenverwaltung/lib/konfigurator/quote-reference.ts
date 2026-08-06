/** Kunden- und UI-Referenz: sevDesk-Nummer falls vorhanden, sonst interne ID. */
export function formatAuftragsNr(quote: {
  id: number
  sevdesk_order_number?: string | null
}): string {
  const sevdesk = quote.sevdesk_order_number?.trim()
  if (sevdesk) return sevdesk
  return `#${quote.id}`
}
