"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { updateQuoteDruckkosten } from "@/lib/actions/kpi"
import { parseBetragInput } from "@/lib/kpi/betrag-input"
import { Loader2 } from "lucide-react"

type QuoteDruckkostenFormProps = {
  quoteId: number
  druckkostenNetto: number | null
}

const toInput = (v: number | null) => (v == null ? "" : String(v).replace(".", ","))

export function QuoteDruckkostenForm({ quoteId, druckkostenNetto }: QuoteDruckkostenFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [value, setValue] = useState(toInput(druckkostenNetto))
  const [saved, setSaved] = useState(toInput(druckkostenNetto))
  const [saving, setSaving] = useState(false)

  const parsed = parseBetragInput(value)
  const invalid = Number.isNaN(parsed)

  const handleSave = async () => {
    if (invalid) return
    setSaving(true)
    const result = await updateQuoteDruckkosten(quoteId, parsed)
    setSaving(false)
    if (result.success) {
      setSaved(value)
      toast({ title: "Gespeichert", description: "Druckkosten aktualisiert" })
      router.refresh()
    } else {
      toast({ title: "Fehler", description: result.error, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`druckkosten-${quoteId}`} className="text-sm">
        Druckkosten (Einkauf, netto)
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={`druckkosten-${quoteId}`}
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="z. B. 180,00"
          className="max-w-[160px]"
        />
        <Button size="sm" onClick={handleSave} disabled={saving || invalid || value === saved}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Speichern
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {invalid ? "Bitte eine Zahl ≥ 0 eingeben." : "Fließt bei bezahlten Aufträgen ins KPI-Dashboard (Kosten) ein."}
      </p>
    </div>
  )
}
