import { redirect } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import { getGroups, getBatches, getBases } from "@/lib/actions/bookings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminActions } from "@/components/admin/admin-actions"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeleteButton } from "@/components/admin/delete-button"
import { EditableBaseRow } from "@/components/admin/editable-base-row"
import { InventoryReportModal } from "@/components/admin/inventory-report-modal"
import { BatchCostsDialog } from "@/components/admin/batch-costs-dialog"
import { getBatchCosts } from "@/lib/actions/kpi"
import { formatEur } from "@/lib/pricing/preis-engine"
import { BarChart3 } from "lucide-react"

export default async function AdminPage() {
  if (!(await isAuthenticated())) redirect("/login")

  const [groups, batches, bases, batchCosts] = await Promise.all([
    getGroups(),
    getBatches(),
    getBases(),
    getBatchCosts().catch(() => []),
  ])
  const batchCostsById = new Map(batchCosts.map((c) => [c.id, c]))

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon">
                <Link href="/warenverwaltung">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-balance">Admin-Bereich</h1>
                <p className="text-sm text-muted-foreground">Datenverwaltung</p>
              </div>
            </div>
            <Button asChild>
              <Link href="/admin/kpi" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                KPI-Dashboard
              </Link>
            </Button>
            <InventoryReportModal />
            <Button asChild variant="outline">
              <Link href="/warenverwaltung/auftraege">Anfragen</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/warenverwaltung">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <AdminActions
            batches={batches.map((batch) => ({
              id: batch.id,
              code: batch.code,
              funktionsumfang: batch.funktionsumfang,
            }))}
            existingGroups={groups.map((group) => ({ name: group.name }))}
          />

          {/* Groups Table */}
          <Card>
            <CardHeader>
              <CardTitle>Leuchtgruppen ({groups.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <p className="text-muted-foreground text-sm">Keine Gruppen vorhanden</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Kanalanzahl</TableHead>
                      <TableHead className="w-[100px]">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-mono text-xs">{group.id}</TableCell>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{group.kanalanzahl ?? 40} CH</TableCell>
                        <TableCell>
                          <DeleteButton type="group" id={group.id} name={group.name} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chargen ({batches.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <p className="text-muted-foreground text-sm">Keine Chargen vorhanden</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Funktionsumfang</TableHead>
                      <TableHead>Lieferant</TableHead>
                      <TableHead>Lieferdatum</TableHead>
                      <TableHead className="text-right">Bänder</TableHead>
                      <TableHead className="text-right">EK / Band</TableHead>
                      <TableHead className="text-right">Gesamt netto</TableHead>
                      <TableHead className="w-[200px]">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => {
                      const costs = batchCostsById.get(batch.id)
                      const gesamt =
                        costs?.einkaufspreisStueck != null
                          ? costs.einkaufspreisStueck * costs.zugangMenge + (costs.fracht ?? 0) + (costs.zoll ?? 0)
                          : null
                      return (
                        <TableRow key={batch.id}>
                          <TableCell className="font-mono text-xs">{batch.id}</TableCell>
                          <TableCell className="font-mono font-medium">{batch.code}</TableCell>
                          <TableCell className="text-sm">{batch.funktionsumfang}</TableCell>
                          <TableCell>{batch.lieferant || "-"}</TableCell>
                          <TableCell>{batch.lieferdatum ? new Date(batch.lieferdatum).toLocaleDateString("de-DE") : "-"}</TableCell>
                          <TableCell className="text-right font-mono">
                            {(costs?.zugangMenge ?? 0).toLocaleString("de-DE")}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {costs?.einkaufspreisStueck != null
                              ? costs.einkaufspreisStueck.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 4 })
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono">{gesamt != null ? formatEur(gesamt) : "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <BatchCostsDialog
                                batchId={batch.id}
                                batchCode={batch.code}
                                einkaufspreisStueck={costs?.einkaufspreisStueck ?? null}
                                fracht={costs?.fracht ?? null}
                                zoll={costs?.zoll ?? null}
                                zugangMenge={costs?.zugangMenge ?? 0}
                              />
                              <DeleteButton type="batch" id={batch.id} name={batch.code} />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Bases Table */}
          <Card>
            <CardHeader>
              <CardTitle>Basen ({bases.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {bases.length === 0 ? (
                <p className="text-muted-foreground text-sm">Keine Basen vorhanden</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Seriennummer</TableHead>
                      <TableHead>Bezeichnung</TableHead>
                      <TableHead>Stationstyp</TableHead>
                      <TableHead>Charge</TableHead>
                      <TableHead>Hersteller</TableHead>
                      <TableHead>Kanalanzahl</TableHead>
                      <TableHead>Firmwareversion</TableHead>
                      <TableHead>Funktionsumfang</TableHead>
                      <TableHead className="text-right">EK netto</TableHead>
                      <TableHead className="w-[100px]">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bases.map((base: any) => (
                      <EditableBaseRow key={base.id} base={base} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
