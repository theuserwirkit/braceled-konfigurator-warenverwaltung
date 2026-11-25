import { NextRequest, NextResponse } from "next/server"
import { getQuoteByPublicToken } from "@/lib/actions/quotes"
import { angebotRequiresPlzGate, hasAngebotAccess } from "@/lib/konfigurator/angebot-access"
import { getQuoteAccessPlz } from "@/lib/konfigurator/kontakt-adresse"
import { getCheckoutUrlForQuote } from "@/lib/quotes-internal"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const ip = getClientIp(request)
  const rateLimit = await checkRateLimit(`angebot:bezahlen:${ip}:${token}`, 20, 15 * 60 * 1000)
  if (!rateLimit.success) return rateLimitResponse(rateLimit)

  const statusPage = new URL(`/angebot/${token}`, request.url)
  const quote = await getQuoteByPublicToken(token)
  if (!quote) return NextResponse.redirect(statusPage)

  const expectedPlz = getQuoteAccessPlz(quote.config_json)
  if (angebotRequiresPlzGate(expectedPlz) && !(await hasAngebotAccess(token))) {
    return NextResponse.redirect(statusPage)
  }

  const { url } = await getCheckoutUrlForQuote(quote)
  if (!url) {
    statusPage.searchParams.set("zahlung", "fehler")
    return NextResponse.redirect(statusPage)
  }
  return NextResponse.redirect(url, 303)
}
