"use client"

import type { PackingSheetData } from "@/lib/konfigurator/packing-sheet"
import { modusAnzeige } from "@/lib/konfigurator/product-info"

export function OrderPackingChecklistUi({ data }: { data: PackingSheetData }) {
  const eventName = [data.kunde, data.eventLabel].filter(Boolean).join(" · ") || "–"

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div>
        <h3 className="font-semibold">Event-Checkliste & Packliste</h3>
        <p className="text-sm text-muted-foreground">
          {eventName} · {data.menge}× {modusAnzeige(data.modus)} · {data.lieferpaket}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="w-8 py-1.5 font-medium" />
              <th className="py-1.5 font-medium">Gegenstand</th>
              <th className="w-20 py-1.5 font-medium">Menge</th>
              <th className="py-1.5 font-medium">Anmerkung</th>
            </tr>
          </thead>
          <tbody>
            {data.eventChecklistItems.map((item) => (
              <tr key={item.gegenstand} className="border-b border-border/60 align-top">
                <td className="py-2 text-muted-foreground">☐</td>
                <td className="py-2 font-medium">{item.gegenstand}</td>
                <td className="py-2 font-mono">{item.menge ?? "–"}</td>
                <td className="py-2 text-muted-foreground">{item.anmerkung ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.checklistAccessories.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium">Lager intern</h4>
          <ul className="space-y-2">
            {data.checklistAccessories.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-muted-foreground">☐</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="mb-2 text-sm font-medium">Prozess-Check: Ausgangskontrolle</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-muted-foreground">☐</span>
            <span>Vollständigkeit: Alle Artikel in der richtigen Menge verpackt.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-muted-foreground">☐</span>
            <span>Funktionstest: Controller auf Funktion geprüft.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-muted-foreground">☐</span>
            <span>Verpackung: Alles sicher in Cases oder Kartonagen verstaut.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
