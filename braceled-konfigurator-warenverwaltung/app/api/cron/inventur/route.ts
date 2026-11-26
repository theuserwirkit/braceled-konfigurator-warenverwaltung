import { NextRequest } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { backfillInventorySnapshots } from "@/lib/kpi/inventory-internal"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8")
  const bBuf = Buffer.from(b, "utf8")
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

/** Vercel Cron: friert am Monatsersten den Lagerstand ein und holt fehlende Monate nach. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const header = request.headers.get("authorization") ?? ""
  if (!safeEqual(header, `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await backfillInventorySnapshots({ quelle: "cron" })
    return Response.json({ ok: true, created: result.created })
  } catch (error) {
    console.error("[cron:inventur] failed:", error)
    return Response.json({ ok: false }, { status: 500 })
  }
}
