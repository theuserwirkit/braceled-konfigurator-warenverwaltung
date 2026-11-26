"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { updateBatchCosts } from "@/lib/actions/kpi"
import { batchUnitCost } from "@/lib/kpi/aggregate"
import { formatEur } from "@/lib/pricing/preis-engine"
import { parseBetragInput } from "@/lib/kpi/betrag-input"
import { Euro, Loader2 } from "lucide-react"

type BatchCostsDialogProps = {
  batchId: number
  batchCode: string
  einkaufspreisStueck: number | null
  fracht: number | null
  zoll: number | null
  zugangMenge: number
}

const toInput = (v: number | null) => (v == null ? "" : String(v).replace(".", ","))

export function BatchCostsDialog(props: BatchCostsDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ek, setEk] = useState(toInput(props.einkaufspreisStueck))
  const [fracht, setFracht] = useState(toInput(props.fracht))
  const [zoll, setZoll] = useState(toInput(props.zoll))

  const parsed = {
    einkaufspreisStueck: parseBetragInput(ek),
    fracht: parseBetragInput(fracht),
    zoll: parseBetragInput(zoll),
  }
  const invalid = Object.values(parsed).some((v) => Number.isNaN(v))
  const unitCost = invalid ? null : batchUnitCost({ ...parsed, zugangMenge: props.zugangMenge })
  const gesamt = invalid
    ? null
    : (parsed.einkaufspreisStueck ?? 0) * props.zugangMenge + (parsed.fracht ?? 0) + (parsed.zoll ?? 0)

  const handleSave = async () => {
    if (invalid) return
    setSaving(true)
    const result = await updateBatchCosts(props.batchId, parsed)
    setSaving(false)
    if (result.success) {
      toast({ title: "Gespeichert", description: `Kosten für Charge ${props.batchCode} aktualisiert` })
      setOpen(false)
      router.refresh()
    } else {
      toast({ title: "Fehler", description: result.error, variant: "destructive" })
    }
  }

  const hasCosts = props.einkaufspreisStueck != null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={hasCosts ? "ghost" : "outline"} size="sm">
          <Euro className="mr-1 h-3.5 w-3.5" />
          {hasCosts ? "Kosten" : "Kosten erfassen"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kosten Charge {props.batchCode}</DialogTitle>
          <DialogDescription>
            Alle Beträge netto. Fracht und Zoll werden für Inventur und Stückkosten auf die gebuchten Band-Zugänge
            dieser Charge umgelegt.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`ek-${props.batchId}`}>Einkaufspreis pro Band (€)</Label>
            <Input
              id={`ek-${props.batchId}`}
              inputMode="decimal"
              value={ek}
              onChange={(e) => setEk(e.target.value)}
              placeholder="z. B. 1,89"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`fracht-${props.batchId}`}>Fracht gesamt (€)</Label>
              <Input
                id={`fracht-${props.batchId}`}
                inputMode="decimal"
                value={fracht}
                onChange={(e) => setFracht(e.target.value)}
                placeholder="optional"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`zoll-${props.batchId}`}>Zoll gesamt (€)</Label>
              <Input
                id={`zoll-${props.batchId}`}
                inputMode="decimal"
                value={zoll}
                onChange={(e) => setZoll(e.target.value)}
                placeholder="optional"
              />
            </div>
          </div>
          <dl className="rounded-md bg-muted/50 p-3 text-sm grid gap-1">
            <div className="flex justify-between">
              <dt>Bänder laut Zugangsbuchungen</dt>
              <dd className="font-mono">{props.zugangMenge.toLocaleString("de-DE")} Stk.</dd>
            </div>
            <div className="flex justify-between">
              <dt>Anschaffungskosten pro Band</dt>
              <dd className="font-mono">
                {unitCost != null
                  ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 4 }).format(unitCost)
                  : "–"}
              </dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>Charge gesamt</dt>
              <dd className="font-mono">{gesamt != null ? formatEur(gesamt) : "–"}</dd>
            </div>
          </dl>
          {invalid && <p className="text-sm text-destructive">Bitte nur Zahlen ≥ 0 eingeben.</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving || invalid}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
