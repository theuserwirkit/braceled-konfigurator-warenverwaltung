import { NextRequest } from "next/server"
import { getQuoteByPublicToken } from "@/lib/actions/quotes"
import { angebotRequiresPlzGate, hasAngebotAccess } from "@/lib/konfigurator/angebot-access"
import { getQuoteAccessPlz } from "@/lib/konfigurator/kontakt-adresse"
import { acceptQuoteByPublicToken } from "@/lib/quotes-internal"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const ip = getClientIp(request)
  const rateLimit = await checkRateLimit(`angebot:accept:${ip}:${token}`, 10, 15 * 60 * 1000)
  if (!rateLimit.success) return rateLimitResponse(rateLimit)

  const quote = await getQuoteByPublicToken(token)
  if (!quote) {
    return Response.json({ error: "Angebot nicht gefunden" }, { status: 404 })
  }

  const expectedPlz = getQuoteAccessPlz(quote.config_json)
  if (angebotRequiresPlzGate(expectedPlz) && !(await hasAngebotAccess(token))) {
    return Response.json({ error: "Kein Zugriff" }, { status: 403 })
  }

  let body: { agbAccepted?: boolean }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ungültiger JSON-Body" }, { status: 400 })
  }

  if (body.agbAccepted !== true) {
    return Response.json(
      { error: "Bitte bestätige die AGB, um das Angebot anzunehmen." },
      { status: 400 },
    )
  }

  const result = await acceptQuoteByPublicToken({ publicToken: token, ip: ip || null })
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 409 })
  }
  return Response.json({ success: true })
}
