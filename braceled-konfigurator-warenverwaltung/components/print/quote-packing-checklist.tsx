"use client"

import type { PackingSheetData } from "@/lib/konfigurator/packing-sheet"
import { PackingShippingDates } from "@/components/print/packing-shipping-dates"

type QuotePackingChecklistProps = {
  data: PackingSheetData
}

const CHECKLIST_PRINT_CSS = `
  .event-checklist-root {
    color: #000;
    background: #fff;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 10pt;
    line-height: 1.35;
  }

  .event-checklist-page {
    width: 210mm;
    min-height: 280mm;
    padding: 10mm;
    box-sizing: border-box;
    color: #000;
    background: #fff;
  }

  @media print {
    @page {
      size: A4;
      margin: 10mm;
    }

    body {
      margin: 0;
      padding: 0;
      color: #000 !important;
      background: #fff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .no-print {
      display: none !important;
    }

    .event-checklist-page {
      width: auto;
      min-height: auto;
      padding: 0;
    }
  }
`

function MetaField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-2 border-b border-black/30 pb-1 text-xs">
      <span className="w-28 shrink-0 font-bold">{label}</span>
      <span className="min-h-[1rem] flex-1">{value || "\u00a0"}</span>
    </div>
  )
}

export function QuotePackingChecklist({ data }: QuotePackingChecklistProps) {
  const eventName = [data.kunde, data.eventLabel].filter(Boolean).join(" · ") || "–"
  const datum = data.eventDatum || data.anlieferungDatum || data.versandDatum || ""

  return (
    <div className="event-checklist-root">
      <style jsx global>{CHECKLIST_PRINT_CSS}</style>

      <div className="event-checklist-page flex flex-col gap-4">
        <header>
          <h1 className="text-base font-black uppercase tracking-wide">
            Event-Checkliste &amp; Packliste
          </h1>
          <p className="mt-1 text-xs text-black/70">Auftrag #{data.quoteId}</p>
        </header>

        <section className="space-y-2">
          <MetaField label="Event / Projekt:" value={eventName} />
          <MetaField label="Datum:" value={datum} />
          <MetaField label="Verantwortlich:" value={data.ansprechpartner} />
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
            <span className="font-bold">Status:</span>
            <span>☐ Packen</span>
            <span>☐ Verladen</span>
          </div>
        </section>

        <section>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="w-10 py-1.5 font-bold">Status</th>
                <th className="py-1.5 font-bold">Gegenstand</th>
                <th className="w-16 py-1.5 font-bold">Relevanz</th>
                <th className="w-16 py-1.5 font-bold">Menge</th>
                <th className="py-1.5 font-bold">Anmerkung</th>
              </tr>
            </thead>
            <tbody>
              {data.eventChecklistItems.map((item) => (
                <tr key={item.gegenstand} className="border-b border-black/25 align-top">
                  <td className="py-2 text-base leading-none">☐</td>
                  <td className="py-2 font-medium">{item.gegenstand}</td>
                  <td className="py-2">
                    <span className="inline-block min-w-[2rem] border-b border-dotted border-black/40">
                      &nbsp;
                    </span>
                  </td>
                  <td className="py-2 font-mono">
                    {item.menge ?? (
                      <span className="inline-block min-w-[2rem] border-b border-dotted border-black/40">
                        &nbsp;
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-[11px] leading-snug">
                    {item.anmerkung ?? (
                      <span className="inline-block min-h-[1rem] w-full border-b border-dotted border-black/40">
                        &nbsp;
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {data.checklistAccessories.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-black uppercase">Lager intern</h2>
            <ul className="space-y-1.5 text-xs">
              {data.checklistAccessories.map((item) => (
                <li key={item} className="flex items-baseline gap-2">
                  <span className="shrink-0 text-base leading-none">☐</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-2 border-t-2 border-black pt-3">
          <h2 className="mb-2 text-xs font-black uppercase">
            Prozess-Check: Ausgangskontrolle
          </h2>
          <ul className="space-y-2 text-xs">
            <li className="flex items-start gap-2">
              <span className="shrink-0 text-base leading-none">☐</span>
              <span>
                <span className="font-bold">Vollständigkeit:</span> Alle oben genannten Artikel
                sind in der richtigen Menge verpackt.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0 text-base leading-none">☐</span>
              <span>
                <span className="font-bold">Funktionstest:</span> Controller auf Funktion geprüft.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0 text-base leading-none">☐</span>
              <span>
                <span className="font-bold">Verpackung:</span> Alles sicher in Cases oder Kartonagen
                verstaut.
              </span>
            </li>
          </ul>
        </section>

        <div className="mt-auto border-t border-black/30 pt-3">
          <PackingShippingDates data={data} />
        </div>
      </div>
    </div>
  )
}
