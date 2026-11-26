"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  recomputeInventorySnapshot,
  runInventoryBackfill,
  type InventorySnapshotSummary,
} from "@/lib/actions/kpi"
import { formatStichtag } from "@/lib/kpi/aggregate"
import { formatEur } from "@/lib/pricing/preis-engine"
import { AlertTriangle, ClipboardList, Loader2, Printer, RefreshCw } from "lucide-react"

const QUELLE_LABELS: Record<string, string> = {
  cron: "Automatisch",
  rueckwirkend: "Rückwirkend",
  manuell: "Manuell",
}

export function InventorySnapshotsPanel({ snapshots }: { snapshots: InventorySnapshotSummary[] }) {
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const [busyStichtag, setBusyStichtag] = useState<string | null>(null)

  const handleBackfill = () => {
    startTransition(async () => {
      const result = await runInventoryBackfill()
      if (result.success) {
        const count = result.created?.length ?? 0
        toast({
          title: "Inventuren aktualisiert",
          description: count > 0 ? `${count} Stichtag(e) angelegt` : "Alle Stichtage sind bereits vorhanden",
        })
      } else {
        toast({ title: "Fehler", description: result.error, variant: "destructive" })
      }
    })
  }

  const handleRecompute = (stichtag: string) => {
    setBusyStichtag(stichtag)
    startTransition(async () => {
      const result = await recomputeInventorySnapshot(stichtag)
      setBusyStichtag(null)
      if (result.success) {
        toast({ title: "Neu berechnet", description: `Inventur zum ${formatStichtag(stichtag)} überschrieben` })
      } else {
        toast({ title: "Fehler", description: result.error, variant: "destructive" })
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Inventur zum Monatsersten
        </CardTitle>
        <Button variant="outline" onClick={handleBackfill} disabled={pending}>
          {pending && !busyStichtag ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Fehlende Stichtage anlegen
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Bestand um 00:00 Uhr des Stichtags, inklusive vermieteter Bänder. Bewertung je Charge zu
          Anschaffungskosten (Einkaufspreis + anteilige Fracht und Zoll). Gespeicherte Inventuren bleiben
          unverändert, bis sie ausdrücklich neu berechnet werden.
        </p>
        {snapshots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Inventur gespeichert. „Fehlende Stichtage anlegen“ berechnet alle Monate seit der ersten
            Lagerbewegung.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stichtag</TableHead>
                <TableHead className="text-right">Bänder</TableHead>
                <TableHead className="text-right">Basen</TableHead>
                <TableHead className="text-right">Wert netto</TableHead>
                <TableHead>Quelle</TableHead>
                <TableHead className="w-[220px]">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{formatStichtag(s.stichtag)}</TableCell>
                  <TableCell className="text-right font-mono">{s.mengeBaender.toLocaleString("de-DE")}</TableCell>
                  <TableCell className="text-right font-mono">{s.mengeBasen.toLocaleString("de-DE")}</TableCell>
                  <TableCell className="text-right font-mono">
                    <span className="inline-flex items-center gap-1">
                      {s.preiseUnvollstaendig && (
                        <AlertTriangle
                          className="h-3.5 w-3.5 text-amber-500"
                          aria-label="Einkaufspreise unvollständig"
                        />
                      )}
                      {formatEur(s.gesamtWertNetto)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{QUELLE_LABELS[s.quelle] ?? s.quelle}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/kpi/inventur/${s.id}/druck?autoprint=1`} target="_blank">
                          <Printer className="mr-1 h-4 w-4" />
                          Drucken
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={pending}>
                            {busyStichtag === s.stichtag ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-1 h-4 w-4" />
                            )}
                            Neu berechnen
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Inventur zum {formatStichtag(s.stichtag)} überschreiben?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Der gespeicherte Stand wird gelöscht und aus den aktuellen Buchungen und
                              Einkaufspreisen neu berechnet. Wurde diese Inventur bereits an Steuerberater oder
                              Finanzamt übergeben, sollte sie nicht mehr verändert werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRecompute(s.stichtag)}>
                              Neu berechnen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
