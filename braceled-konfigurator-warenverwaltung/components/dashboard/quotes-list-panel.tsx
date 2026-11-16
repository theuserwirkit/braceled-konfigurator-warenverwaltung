"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatEur } from "@/lib/pricing/preis-engine"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Archive, ArchiveRestore, MoreHorizontal, Plus, Search } from "lucide-react"
import { UpcomingFulfillmentOrders } from "@/components/admin/upcoming-fulfillment-orders"
import { archiveQuote, unarchiveQuote } from "@/lib/actions/quotes"
import { toast } from "@/hooks/use-toast"
import {
  STATUS_LABELS,
  SOURCE_LABELS,
  statusBadgeVariant,
  ACTIVE_STATUSES,
} from "@/lib/konfigurator/quote-status"
import {
  FULFILLMENT_STATUS_LABELS,
  getNextFulfillmentStep,
} from "@/lib/konfigurator/fulfillment-status"
import type { QuoteRequest, QuoteSource, QuoteStatus } from "@/lib/konfigurator/types"

const FILTER_STATUSES: (QuoteStatus | "all" | "active" | "fulfillment_open")[] = [
  "all",
  "active",
  "fulfillment_open",
  "submitted",
  "payment_pending",
  "approved",
  "paid",
  "rejected",
  "cancelled",
  "expired",
]

interface QuotesListPanelProps {
  quotes: QuoteRequest[]
  stats: Record<string, number>
  priorityOrders: QuoteRequest[]
  statusFilter?: QuoteStatus | "all" | "active" | "fulfillment_open"
  sourceFilter?: QuoteSource | "all"
  showArchived?: boolean
  basePath?: string
}

export function QuotesListPanel({
  quotes,
  stats,
  priorityOrders,
  statusFilter,
  sourceFilter,
  showArchived = false,
  basePath = "/warenverwaltung/auftraege",
}: QuotesListPanelProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const pendingCount = stats.submitted || 0
  const paymentPendingCount = (stats.payment_pending || 0) + (stats.approved || 0)
  const fulfillmentOpenCount = stats.fulfillment_open || 0

  function filterUrl(overrides: { status?: string; source?: string; archiv?: boolean }) {
    const status = overrides.status ?? statusFilter ?? "all"
    const source = overrides.source ?? sourceFilter ?? "all"
    const archiv = overrides.archiv ?? showArchived
    const qs = new URLSearchParams()
    if (status !== "all") qs.set("status", status)
    if (source !== "all") qs.set("source", source)
    if (archiv) qs.set("archiv", "1")
    const query = qs.toString()
    return query ? `${basePath}?${query}` : basePath
  }

  function handleArchiveToggle(quoteId: number, archived: boolean, status?: QuoteStatus) {
    setPendingId(quoteId)
    startTransition(async () => {
      const result = archived
        ? await unarchiveQuote(quoteId)
        : await archiveQuote(quoteId)
      setPendingId(null)
      if (!result.success) {
        toast({
          title: archived ? "Wiederherstellen fehlgeschlagen" : "Archivieren fehlgeschlagen",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      const willCancel =
        !archived && status && ["submitted", "payment_pending", "approved"].includes(status)
      toast({
        title: archived ? "Wiederhergestellt" : "Archiviert",
        description: archived
          ? "Auftrag erscheint wieder in der aktiven Liste."
          : willCancel
            ? "Aus Liste entfernt, Hold freigegeben, Storno-Mail an Kunden."
            : "Aus Liste entfernt.",
      })
      router.refresh()
    })
  }

  const filteredQuotes = useMemo(() => {
    if (!searchTerm.trim()) return quotes
    const term = searchTerm.toLowerCase()
    return quotes.filter((q) => {
      const price = q.price_snapshot_json as { gesamt_netto?: number }
      const haystack = [
        String(q.id),
        q.lead_email,
        q.config_json.produkt,
        q.config_json.modus,
        q.config_json.kontaktFirma,
        q.config_json.kontaktName,
        q.booking_id ? String(q.booking_id) : "",
        formatEur(price.gesamt_netto || 0),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [quotes, searchTerm])

  return (
    <div className="flex flex-col gap-6">
      {!showArchived && (
        <UpcomingFulfillmentOrders orders={priorityOrders} detailBasePath={basePath} />
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle>{showArchived ? "Archivierte Aufträge" : "Aufträge"}</CardTitle>
                {!showArchived && pendingCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    {pendingCount} Freigabe
                  </span>
                )}
                {!showArchived && paymentPendingCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    {paymentPendingCount} Zahlung
                  </span>
                )}
                {!showArchived && fulfillmentOpenCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                    {fulfillmentOpenCount} in Bearbeitung
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <Link href={filterUrl({ archiv: !showArchived })}>
                    {showArchived ? (
                      <>
                        <ArchiveRestore className="h-4 w-4" />
                        Aktive anzeigen
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4" />
                        Archivierte anzeigen
                      </>
                    )}
                  </Link>
                </Button>
                {!showArchived && (
                  <Button asChild size="sm" className="gap-1.5 shrink-0">
                    <Link href="/warenverwaltung/auftraege/neu">
                      <Plus className="h-4 w-4" />
                      Neuer Auftrag
                    </Link>
                  </Button>
                )}
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suche nach Kunde, ID, Produkt..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 border-2 hover:border-wristlink-cyan/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTER_STATUSES.map((s) => {
                const count =
                  s === "all"
                    ? Object.entries(stats)
                        .filter(([key]) => key !== "fulfillment_open")
                        .reduce((sum, [, value]) => sum + value, 0)
                    : s === "active"
                      ? ACTIVE_STATUSES.reduce((sum, st) => sum + (stats[st] || 0), 0)
                      : s === "fulfillment_open"
                        ? stats.fulfillment_open || 0
                        : stats[s] || 0
                const label =
                  s === "all"
                    ? "Alle"
                    : s === "active"
                      ? "Aktiv"
                      : s === "fulfillment_open"
                        ? "In Bearbeitung"
                        : STATUS_LABELS[s as QuoteStatus]
                const active = (statusFilter || "all") === s
                return (
                  <Button
                    key={s}
                    asChild
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className={
                      active
                        ? undefined
                        : "border-2 hover:border-wristlink-cyan/50"
                    }
                  >
                    <Link href={filterUrl({ status: s })}>
                      {label} ({count})
                    </Link>
                  </Button>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              {(["all", "konfigurator", "n8n_email", "manual"] as const).map((s) => {
                const active = (sourceFilter || "all") === s
                const label = s === "all" ? "Alle Quellen" : SOURCE_LABELS[s]
                return (
                  <Button
                    key={s}
                    asChild
                    variant={active ? "secondary" : "outline"}
                    size="sm"
                    className={active ? undefined : "text-muted-foreground"}
                  >
                    <Link href={filterUrl({ source: s })}>{label}</Link>
                  </Button>
                )
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Quelle</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Produkt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fulfillment</TableHead>
                  <TableHead>Nächster Schritt</TableHead>
                  <TableHead>Buchung</TableHead>
                  <TableHead className="text-right">Netto</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      {showArchived
                        ? "Keine archivierten Aufträge"
                        : "Keine Ergebnisse gefunden"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((q) => {
                    const price = q.price_snapshot_json as { gesamt_netto?: number }
                    const hasDruck = Boolean(q.config_json.druck)
                    const nextStep =
                      q.status === "paid"
                        ? getNextFulfillmentStep(q.fulfillment_status, hasDruck)
                        : null
                    const detailHref = `${basePath}/${q.id}`
                    return (
                      <TableRow
                        key={q.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(detailHref)}
                      >
                        <TableCell className="font-mono">#{q.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{SOURCE_LABELS[q.source]}</Badge>
                        </TableCell>
                        <TableCell>{q.lead_email}</TableCell>
                        <TableCell>
                          {q.config_json.produkt} ({q.config_json.modus})
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(q.status)}>
                            {STATUS_LABELS[q.status] || q.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {q.fulfillment_status ? (
                            <Badge variant="outline">
                              {FULFILLMENT_STATUS_LABELS[q.fulfillment_status]}
                            </Badge>
                          ) : (
                            "–"
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {nextStep ? (
                            <span className="text-amber-700 dark:text-amber-400">
                              {FULFILLMENT_STATUS_LABELS[nextStep]}
                            </span>
                          ) : q.status === "paid" ? (
                            <span className="text-muted-foreground">fertig</span>
                          ) : (
                            "–"
                          )}
                        </TableCell>
                        <TableCell
                          className="font-mono text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {q.booking_id ? (
                            <Link
                              href={`/warenverwaltung/buchungen?highlight=${q.booking_id}`}
                              className="text-primary underline underline-offset-2"
                            >
                              #{q.booking_id}
                            </Link>
                          ) : (
                            "–"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatEur(price.gesamt_netto || 0)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {q.submitted_at
                            ? new Date(q.submitted_at).toLocaleDateString("de-DE")
                            : "–"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isPending && pendingId === q.id}
                                aria-label="Aktionen"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={detailHref}>Details</Link>
                              </DropdownMenuItem>
                              {showArchived ? (
                                <DropdownMenuItem
                                  onSelect={() => handleArchiveToggle(q.id, true, q.status)}
                                  disabled={isPending && pendingId === q.id}
                                >
                                  Wiederherstellen
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onSelect={() => handleArchiveToggle(q.id, false, q.status)}
                                  disabled={isPending && pendingId === q.id}
                                >
                                  Archivieren
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
