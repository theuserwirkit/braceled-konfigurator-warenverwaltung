import type { QuoteRequest } from "@/lib/konfigurator/types"

/** Wie lange ein versendetes Angebot bzw. ein angenommenes Stripe-Angebot reserviert bleibt. */
export const OFFER_VALIDITY_DAYS = 7

export function computeOfferExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + OFFER_VALIDITY_DAYS * 24 * 60 * 60 * 1000)
}

export function isOfferAwaitingAcceptance(
  quote: Pick<QuoteRequest, "status" | "offer_payment_mode" | "accepted_at">,
): boolean {
  return quote.status === "approved" && quote.offer_payment_mode != null && !quote.accepted_at
}

export function canPayOnline(
  quote: Pick<QuoteRequest, "status" | "offer_payment_mode" | "accepted_at">,
): boolean {
  return (
    quote.status === "payment_pending" &&
    quote.offer_payment_mode === "stripe" &&
    quote.accepted_at != null
  )
}

export function buildAnnahmeUrl(statusUrl: string): string {
  return `${statusUrl}?annehmen=1`
}

export function buildBezahlenUrl(statusUrl: string): string {
  return `${statusUrl}/bezahlen`
}
