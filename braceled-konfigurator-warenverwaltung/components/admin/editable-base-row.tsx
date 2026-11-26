"use client"

import { useState } from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { updateBase } from "@/lib/actions/admin"
import { updateBaseEinkaufspreis } from "@/lib/actions/kpi"
import { parseBetragInput } from "@/lib/kpi/betrag-input"
import { formatEur } from "@/lib/pricing/preis-engine"
import { DeleteButton } from "@/components/admin/delete-button"
import { BASE_STATION_TYP_OPTIONS, STATION_TYP_LABELS, type BaseStationTyp } from "@/lib/konfigurator/station-types"
import { Pencil, Check, X } from "lucide-react"

interface EditableBaseRowProps {
  base: {
    id: number
    bezeichnung: string
    seriennummer?: string | null
    batch_code?: string
    hersteller: string
    kanalanzahl: number
    firmwareversion: string | null
    funktionsumfang: string | null
    station_typ?: string
    einkaufspreis_netto?: string | number | null
  }
}

const formatPreisInput = (v: string | number | null | undefined) =>
  v == null || v === "" ? "" : String(Number(v)).replace(".", ",")

export function EditableBaseRow({ base }: EditableBaseRowProps) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [bezeichnung, setBezeichnung] = useState(base.bezeichnung)
  const [seriennummer, setSeriennummer] = useState(base.seriennummer ?? "")
  const [stationTyp, setStationTyp] = useState<BaseStationTyp>(
    (base.station_typ as BaseStationTyp) || "keine",
  )
  const [einkaufspreis, setEinkaufspreis] = useState(formatPreisInput(base.einkaufspreis_netto))
  const [savedPreis, setSavedPreis] = useState(formatPreisInput(base.einkaufspreis_netto))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (saving) return
    if (!bezeichnung.trim() || !seriennummer.trim()) {
      toast({
        title: "Fehler",
        description: "Bezeichnung und Seriennummer sind erforderlich.",
        variant: "destructive",
      })
      return
    }
    const preis = parseBetragInput(einkaufspreis)
    if (Number.isNaN(preis)) {
      toast({ title: "Fehler", description: "Einkaufspreis bitte als Zahl ≥ 0 eingeben.", variant: "destructive" })
      return
    }
    setSaving(true)
    const result = await updateBase(base.id, {
      bezeichnung: bezeichnung.trim(),
      seriennummer: seriennummer.trim(),
      stationTyp,
    })
    const preisResult =
      result.success && einkaufspreis !== savedPreis
        ? await updateBaseEinkaufspreis(base.id, preis)
        : { success: true as const, error: undefined }
    setSaving(false)
    if (result.success && !preisResult.success) {
      toast({ title: "Fehler", description: preisResult.error, variant: "destructive" })
      return
    }
    if (result.success) {
      setSavedPreis(einkaufspreis)
      toast({ title: "Gespeichert", description: "Basis wurde aktualisiert" })
      setEditing(false)
    } else {
      toast({ title: "Fehler", description: result.error, variant: "destructive" })
    }
  }

  const handleCancel = () => {
    setBezeichnung(base.bezeichnung)
    setSeriennummer(base.seriennummer ?? "")
    setStationTyp((base.station_typ as BaseStationTyp) || "keine")
    setEinkaufspreis(savedPreis)
    setEditing(false)
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{base.id}</TableCell>
      <TableCell className="font-mono text-xs">{base.seriennummer || "–"}</TableCell>
      <TableCell>
        {editing ? (
          <div className="flex flex-col gap-2">
            <Input
              value={bezeichnung}
              onChange={(e) => setBezeichnung(e.target.value)}
              className="h-8 w-48"
              placeholder="Bezeichnung"
              autoFocus
            />
            <Input
              value={seriennummer}
              onChange={(e) => setSeriennummer(e.target.value)}
              className="h-8 w-48 font-mono text-xs"
              placeholder="Seriennummer"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
                if (e.key === "Escape") handleCancel()
              }}
            />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleSave} disabled={saving}>
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <span className="font-medium">{bezeichnung}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell>
        {editing ? (
          <Select value={stationTyp} onValueChange={(v) => setStationTyp(v as BaseStationTyp)}>
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BASE_STATION_TYP_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          STATION_TYP_LABELS[(base.station_typ as BaseStationTyp) || "keine"]
        )}
      </TableCell>
      <TableCell>
        {base.batch_code ? (
          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{base.batch_code}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>{base.hersteller}</TableCell>
      <TableCell>{base.kanalanzahl}</TableCell>
      <TableCell>{base.firmwareversion || "-"}</TableCell>
      <TableCell>{base.funktionsumfang || "-"}</TableCell>
      <TableCell className="text-right font-mono">
        {editing ? (
          <Input
            value={einkaufspreis}
            onChange={(e) => setEinkaufspreis(e.target.value)}
            className="h-8 w-24 text-right"
            inputMode="decimal"
            placeholder="€ netto"
            aria-label="Einkaufspreis netto"
          />
        ) : savedPreis ? (
          formatEur(parseBetragInput(savedPreis) ?? 0)
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell>
        <DeleteButton type="base" id={base.id} name={bezeichnung} />
      </TableCell>
    </TableRow>
  )
}
