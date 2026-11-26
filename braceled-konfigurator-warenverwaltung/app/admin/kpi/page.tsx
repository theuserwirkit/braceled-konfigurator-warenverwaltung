import Link from "next/link"
import { redirect } from "next/navigation"
import { canAdmin, getUser, isAuthenticated } from "@/lib/auth"
import { getKpiDashboardData, listInventorySnapshots } from "@/lib/actions/kpi"
import { COST_KATEGORIE_LABELS, type KpiCostKategorie } from "@/lib/kpi/aggregate"
import { SOURCE_LABELS, STATUS_LABELS } from "@/lib/konfigurator/quote-status"
import type { QuoteSource } from "@/lib/konfigurator/types"
import { formatEur } from "@/lib/pricing/preis-engine"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { KpiPeriodSelect } from "@/components/admin/kpi/kpi-period-select"
import {
  AnfragenVerlaufChart,
  BaenderWochenChart,
  KostenChart,
  UmsatzChart,
} from "@/components/admin/kpi/kpi-charts"
import { InventorySnapshotsPanel } from "@/components/admin/kpi/inventory-snapshots-panel"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

const stk = (n: number) => n.toLocaleString("de-DE")
const pct = (n: number) => `${(n * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`

function StatCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-mono">{value}</CardTitle>
      </CardHeader>
      {hint ? <CardContent className="pt-0 text-xs text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  )
}

export default async function KpiDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>
}) {
  if (!(await isAuthenticated())) redirect("/login")
  if (!(await canAdmin(await getUser()))) redirect("/warenverwaltung")

  const { periode } = await searchParams
  const [{ period, dashboard }, snapshots] = await Promise.all([
    getKpiDashboardData(periode),
    listInventorySnapshots(),
  ])
  const { anfragen, baender, umsatz, kosten } = dashboard

  const funnel = [
    { label: "Eingang", value: anfragen.eingang },
    { label: "Angebot versendet", value: anfragen.angebot },
    { label: "Angenommen", value: anfragen.angenommen },
    { label: "Bezahlt", value: anfragen.bezahlt },
  ]
  const baenderGebucht = baender.summe.mieteGebucht + baender.summe.kaufGebucht
  const baenderOffen = baender.summe.mieteOffen + baender.summe.kaufOffen

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon">
                <Link href="/admin">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-balance">KPI-Dashboard</h1>
                <p className="text-sm text-muted-foreground">{period.label} · alle Beträge netto</p>
              </div>
            </div>
            <KpiPeriodSelect periodKey={period.key} currentYear={new Date().getFullYear()} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex flex-col gap-10">
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold">Anfragen</h2>
            <p className="text-sm text-muted-foreground">Nach Eingangsdatum der Anfrage</p>
          </div>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            {funnel.map((f) => (
              <StatCard key={f.label} title={f.label} value={stk(f.value)} />
            ))}
            <StatCard title="Abschlussquote" value={pct(anfragen.abschlussquote)} hint="Bezahlt / Eingang" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Verlauf (12 Monate)</CardTitle>
              </CardHeader>
              <CardContent>
                <AnfragenVerlaufChart data={anfragen.verlauf} />
              </CardContent>
            </Card>
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nach Quelle</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {anfragen.nachQuelle.length === 0 && <p className="text-muted-foreground">Keine Anfragen</p>}
                  {anfragen.nachQuelle.map((q) => (
                    <div key={q.quelle} className="flex justify-between">
                      <span>{SOURCE_LABELS[q.quelle as QuoteSource] ?? q.quelle}</span>
                      <span className="font-mono">{stk(q.anzahl)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Verloren (Gründe)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {anfragen.verloren.length === 0 && <p className="text-muted-foreground">Keine</p>}
                  {anfragen.verloren.map((v) => (
                    <div key={`${v.status}-${v.grund}`} className="flex justify-between gap-4">
                      <span className="truncate" title={v.grund}>
                        <span className="text-muted-foreground">{STATUS_LABELS[v.status]}:</span> {v.grund}
                      </span>
                      <span className="font-mono">{stk(v.anzahl)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold">Bänder pro Kalenderwoche</h2>
            <p className="text-sm text-muted-foreground">
              Nach Eventdatum · gebucht = bezahlt · offen = in Prüfung, Angebot versendet oder angenommen
            </p>
          </div>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard title="Gebucht" value={`${stk(baenderGebucht)} Stk.`} />
            <StatCard title="Offen" value={`${stk(baenderOffen)} Stk.`} />
            <StatCard
              title="Davon Miete / Kauf"
              value={`${stk(baender.summe.mieteGebucht + baender.summe.mieteOffen)} / ${stk(baender.summe.kaufGebucht + baender.summe.kaufOffen)}`}
            />
            <StatCard title="Bestand gesamt" value={`${stk(baender.bestand)} Stk.`} hint="Aktueller Eigenbestand" />
          </div>
          <Card>
            <CardContent className="pt-6">
              <BaenderWochenChart data={baender.wochen} bestand={baender.bestand} />
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold">Umsatz Soll / Ist</h2>
            <p className="text-sm text-muted-foreground">
              Nach Eventdatum · Soll = Angebotssumme offener und bezahlter Anfragen · Ist = bezahlt
            </p>
          </div>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard title="Soll" value={formatEur(umsatz.soll)} />
            <StatCard title="Ist" value={formatEur(umsatz.ist)} />
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Erreicht</CardDescription>
                <CardTitle className="text-2xl font-mono">{pct(umsatz.quote)}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-green-600"
                    style={{ width: `${Math.min(umsatz.quote * 100, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
            <StatCard
              title="Ø Auftragswert"
              value={formatEur(umsatz.durchschnittAuftrag)}
              hint={`${stk(umsatz.auftraegeBezahlt)} bezahlte Aufträge`}
            />
          </div>
          <Card>
            <CardContent className="pt-6">
              <UmsatzChart data={umsatz.monate} />
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold">Kosten</h2>
            <p className="text-sm text-muted-foreground">
              Einkauf, Fracht und Zoll nach Lieferdatum der Charge · Basen nach Anlagedatum · Druck nach Eventdatum
              bezahlter Aufträge. Pflege unter{" "}
              <Link href="/admin" className="underline underline-offset-2">
                Admin → Chargen/Basen
              </Link>{" "}
              und im Auftrag (Info-Tab).
            </p>
          </div>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard title="Kosten gesamt" value={formatEur(kosten.gesamt)} />
            <StatCard
              title="Ist-Umsatz − Kosten"
              value={formatEur(kosten.ergebnis)}
              hint="Vereinfachte Sicht ohne Abschreibung"
            />
            <Card className="col-span-2 border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Nach Kategorie</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                {(Object.keys(COST_KATEGORIE_LABELS) as KpiCostKategorie[]).map((k) => (
                  <div key={k} className="flex justify-between">
                    <span>{COST_KATEGORIE_LABELS[k]}</span>
                    <span className="font-mono">{formatEur(kosten.nachKategorie[k])}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="pt-6">
              <KostenChart data={kosten.monate} />
            </CardContent>
          </Card>
        </section>

        <section>
          <InventorySnapshotsPanel snapshots={snapshots} />
        </section>
      </main>
    </div>
  )
}
