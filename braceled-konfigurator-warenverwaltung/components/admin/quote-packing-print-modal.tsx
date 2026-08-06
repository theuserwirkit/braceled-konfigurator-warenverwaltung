"use client"

import { useRef, useState } from "react"
import { Package, Printer, Check, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import type { PackingSheetData } from "@/lib/konfigurator/packing-sheet"
import { QuoteBagLabels } from "@/components/print/quote-bag-labels"
import { QuotePackingChecklist } from "@/components/print/quote-packing-checklist"
import { QuoteWarehouseOverview } from "@/components/print/quote-warehouse-overview"

type QuotePackingPrintModalProps = {
  quoteId: number
  quoteStatus: string
  canPrint: boolean
  packingSheetData?: PackingSheetData | null
  /** Vollständige Materialzuweisung – nötig für „Druck erledigt“. */
  allocationReady?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
  triggerClassName?: string
  triggerLabel?: string
  triggerVariant?: "default" | "outline" | "ghost"
  onConfirmPrint?: () => void
  confirmingPrint?: boolean
}

const PRINT_TABS = [
  { value: "labels", label: "Tüten-Labels" },
  { value: "checkliste", label: "Checkliste" },
  { value: "uebersicht", label: "Übersicht" },
] as const

type PrintTab = (typeof PRINT_TABS)[number]["value"]

function PrintTabPanel({
  tab,
  data,
}: {
  tab: PrintTab
  data: PackingSheetData
}) {
  const previewRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const node = previewRef.current
    if (!node) return
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700")
    if (!printWindow) return

    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((el) => el.outerHTML)
      .join("\n")

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Druck</title>${styles}
      <style>
        body { margin: 0; background: #fff; color: #000; }
        @media print { body { margin: 0; } }
      </style>
    </head><body>${node.innerHTML}</body></html>`)
    printWindow.document.close()
    printWindow.focus()
    // Styles brauchen einen Tick zum Laden
    window.setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <div className="space-y-4">
      <div className="mx-auto max-h-[640px] w-full max-w-[640px] overflow-auto rounded-lg border bg-white shadow-md">
        <div ref={previewRef} className="bg-white p-2 text-black">
          {tab === "labels" && <QuoteBagLabels data={data} />}
          {tab === "checkliste" && <QuotePackingChecklist data={data} />}
          {tab === "uebersicht" && <QuoteWarehouseOverview data={data} />}
        </div>
      </div>
      <Button className="flex w-full items-center gap-2" onClick={handlePrint}>
        <Printer className="h-4 w-4" />
        Drucken
      </Button>
    </div>
  )
}

export function QuotePackingPrintModal({
  quoteId: _quoteId,
  quoteStatus,
  canPrint,
  packingSheetData,
  allocationReady = true,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
  triggerClassName,
  triggerLabel = "Lagerunterlagen",
  triggerVariant = "outline",
  onConfirmPrint,
  confirmingPrint = false,
}: QuotePackingPrintModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  function setOpen(next: boolean) {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  if (quoteStatus !== "paid") return null

  const dialogBody = (
    <DialogContent className="flex max-h-[92vh] w-[min(100vw-2rem,42rem)] flex-col gap-4 overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Lagerunterlagen drucken
        </DialogTitle>
      </DialogHeader>

      {!allocationReady && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Vorschau und Druck sind möglich. Für „Druck erledigt“ bitte zuerst Leuchtgruppen,
          Chargen und Basis-Station vollständig zuweisen.
        </p>
      )}

      {!packingSheetData ? (
        <p className="text-sm text-destructive">
          Packdaten konnten nicht geladen werden. Seite neu laden und erneut versuchen.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Labels: Thermodrucker A6 (105 × 148 mm). Checkliste: A4. Skalierung 100 %.
          </p>

          <Tabs defaultValue="checkliste">
            <TabsList className="w-full">
              {PRINT_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex-1 text-xs sm:text-sm">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {PRINT_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-4">
                <PrintTabPanel tab={tab.value} data={packingSheetData} />
              </TabsContent>
            ))}

            {onConfirmPrint && (
              <Button
                type="button"
                variant="secondary"
                className="mt-2 w-full gap-2"
                onClick={onConfirmPrint}
                disabled={confirmingPrint || !allocationReady}
                title={
                  allocationReady ? undefined : "Erst nach vollständiger Materialzuweisung"
                }
              >
                {confirmingPrint ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Druck erledigt – weiter zum Packen
              </Button>
            )}
          </Tabs>
        </>
      )}
    </DialogContent>
  )

  if (!showTrigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogBody}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerClassName ? "default" : "sm"}
          className={triggerClassName ?? "flex items-center gap-2"}
          disabled={!canPrint}
        >
          <Package className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      {dialogBody}
    </Dialog>
  )
}
