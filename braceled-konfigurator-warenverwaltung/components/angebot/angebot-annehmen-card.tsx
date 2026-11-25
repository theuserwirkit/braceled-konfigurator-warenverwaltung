"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Handshake, Loader2 } from "lucide-react"
import { formatEur } from "@/lib/pricing/preis-engine"
import type { OfferPaymentMode } from "@/lib/konfigurator/types"

export function AngebotAnnehmenCard({
  token,
  auftragsNr,
  totalBrutto,
  gueltigBis,
  paymentMode,
}: {
  token: string
  auftragsNr: string
  totalBrutto: number
  gueltigBis: string | null
  paymentMode: OfferPaymentMode
}) {
  const router = useRouter()
  const [agbAccepted, setAgbAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/angebot/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agbAccepted }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Annahme nicht möglich – bitte erneut versuchen.")
        return
      }
      router.replace(`/angebot/${token}?angenommen=1`)
      router.refresh()
    } catch {
      setError("Netzwerkfehler – bitte erneut versuchen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card id="angebot-annehmen" className="border-primary/40 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Handshake className="h-5 w-5 text-primary" />
          Dein Angebot {auftragsNr}
        </CardTitle>
        <CardDescription>
          Wir freuen uns, dir dieses Angebot unterbreiten zu können.
          {gueltigBis && <> Wir halten die LED-Armbänder bis zum {gueltigBis} für dich bereit.</>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between rounded-lg bg-muted/50 px-4 py-3">
          <span className="text-sm text-muted-foreground">Gesamtbetrag inkl. 19 % MwSt.</span>
          <span className="text-xl font-semibold">{formatEur(totalBrutto)}</span>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="agb-accept"
            checked={agbAccepted}
            onCheckedChange={(v) => setAgbAccepted(v === true)}
            className="mt-0.5"
          />
          <Label htmlFor="agb-accept" className="text-sm font-normal leading-relaxed">
            Ich habe die{" "}
            <Link href="/agb" target="_blank" className="underline underline-offset-2">
              AGB
            </Link>{" "}
            gelesen und nehme das Angebot verbindlich an.
          </Label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          size="lg"
          className="w-full"
          onClick={handleAccept}
          disabled={!agbAccepted || loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Angebot verbindlich annehmen"}
        </Button>
        <p className="text-xs text-muted-foreground">
          {paymentMode === "stripe"
            ? "Nach der Annahme kannst du direkt online bezahlen. Mit dem Zahlungseingang ist dein Termin fest gebucht."
            : "Nach der Annahme erhältst du die Rechnung per E-Mail. Mit dem Zahlungseingang ist dein Termin fest gebucht."}
        </p>
      </CardContent>
    </Card>
  )
}
