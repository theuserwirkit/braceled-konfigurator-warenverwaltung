"use client"

import { AutoPrint } from "@/components/print/auto-print"
import type { InventorySnapshotItemRow, InventorySnapshotSummary } from "@/lib/actions/kpi"
import { formatStichtag } from "@/lib/kpi/aggregate"
import { formatEur } from "@/lib/pricing/preis-engine"

type InventorySnapshotPrintViewProps = {
  snapshot: InventorySnapshotSummary
  items: InventorySnapshotItemRow[]
  autoprint?: boolean
}

const th = "px-2 py-1.5 text-xs uppercase tracking-wide text-muted-foreground font-semibold border-b border-border"
const td = "px-2 py-1.5"

const formatStueckpreis = (v: number | null) =>
  v == null
    ? "fehlt"
    : new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 4 }).format(v)

export function InventorySnapshotPrintView({ snapshot, items, autoprint = false }: InventorySnapshotPrintViewProps) {
  const baender = items.filter((i) => i.itemTyp === "band")
  const basen = items.filter((i) => i.itemTyp === "basis")
  const wertBaender = baender.reduce((s, i) => s + i.wertNetto, 0)
  const wertBasen = basen.reduce((s, i) => s + i.wertNetto, 0)
  const title = `Inventur zum ${formatStichtag(snapshot.stichtag)}`

  return (
    <>
      <AutoPrint autoprint={autoprint} />
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="p-4 text-sm">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-muted-foreground mb-6">
          Bestand um 00:00 Uhr · Bewertung zu Anschaffungskosten (Einkaufspreis zzgl. anteiliger Fracht und Zoll),
          netto · gespeichert am {new Date(snapshot.createdAt).toLocaleString("de-DE")}
        </p>

        <div className="flex gap-10 mb-8">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">LED-Bänder</div>
            <div className="text-2xl font-bold">{snapshot.mengeBaender.toLocaleString("de-DE")} Stk.</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Basisstationen</div>
            <div className="text-2xl font-bold">{snapshot.mengeBasen.toLocaleString("de-DE")} Stk.</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Gesamtwert netto</div>
            <div className="text-2xl font-bold">{formatEur(snapshot.gesamtWertNetto)}</div>
          </div>
        </div>

        {snapshot.preiseUnvollstaendig && (
          <p className="mb-6 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">
            Hinweis: Für einzelne Positionen ist kein Einkaufspreis hinterlegt. Diese sind mit 0 € bewertet.
          </p>
        )}

        <h2 className="font-semibold border-b border-border pb-1 mb-2">LED-Bänder je Leuchtgruppe und Charge</h2>
        <table className="w-full border-collapse mb-8">
          <thead>
            <tr className="bg-muted/50">
              <th className={`${th} text-left`}>Leuchtgruppe</th>
              <th className={`${th} text-left`}>Charge</th>
              <th className={`${th} text-left`}>Lieferant</th>
              <th className={`${th} text-right`}>Menge</th>
              <th className={`${th} text-right`}>Stückpreis</th>
              <th className={`${th} text-right`}>Wert</th>
            </tr>
          </thead>
          <tbody>
            {baender.map((i, idx) => (
              <tr key={`b-${idx}`} className="border-b border-border/50">
                <td className={td}>{i.groupName ?? "—"}</td>
                <td className={`${td} font-mono text-xs`}>{i.batchCode ?? "—"}</td>
                <td className={td}>{i.lieferant ?? "—"}</td>
                <td className={`${td} text-right`}>{i.menge.toLocaleString("de-DE")}</td>
                <td className={`${td} text-right`}>{formatStueckpreis(i.stueckpreisNetto)}</td>
                <td className={`${td} text-right`}>{formatEur(i.wertNetto)}</td>
              </tr>
            ))}
            <tr className="font-semibold bg-muted/30">
              <td className={td} colSpan={3}>
                Summe Bänder
              </td>
              <td className={`${td} text-right`}>{snapshot.mengeBaender.toLocaleString("de-DE")}</td>
              <td />
              <td className={`${td} text-right`}>{formatEur(wertBaender)}</td>
            </tr>
          </tbody>
        </table>

        <h2 className="font-semibold border-b border-border pb-1 mb-2">Basisstationen</h2>
        {basen.length === 0 ? (
          <p className="text-muted-foreground mb-8">Keine Basisstationen im Bestand.</p>
        ) : (
          <table className="w-full border-collapse mb-8">
            <thead>
              <tr className="bg-muted/50">
                <th className={`${th} text-left`}>Seriennummer</th>
                <th className={`${th} text-left`}>Bezeichnung</th>
                <th className={`${th} text-left`}>Charge</th>
                <th className={`${th} text-right`}>Einkaufspreis</th>
              </tr>
            </thead>
            <tbody>
              {basen.map((i, idx) => (
                <tr key={`s-${idx}`} className="border-b border-border/50">
                  <td className={`${td} font-mono text-xs`}>{i.seriennummer ?? "—"}</td>
                  <td className={td}>{i.baseBezeichnung ?? "—"}</td>
                  <td className={`${td} font-mono text-xs`}>{i.batchCode ?? "—"}</td>
                  <td className={`${td} text-right`}>{formatStueckpreis(i.stueckpreisNetto)}</td>
                </tr>
              ))}
              <tr className="font-semibold bg-muted/30">
                <td className={td} colSpan={3}>
                  Summe Basisstationen ({basen.length} Stk.)
                </td>
                <td className={`${td} text-right`}>{formatEur(wertBasen)}</td>
              </tr>
            </tbody>
          </table>
        )}

        <div className="mt-12 grid grid-cols-2 gap-12">
          <div className="border-t border-foreground pt-1 text-xs">Ort, Datum</div>
          <div className="border-t border-foreground pt-1 text-xs">Unterschrift</div>
        </div>

        <div className="mt-8 pt-4 border-t border-border text-xs text-muted-foreground">
          Wristlink Inventur · {title} · Druckdatum: {new Date().toLocaleDateString("de-DE")}
        </div>
      </div>
    </>
  )
}
