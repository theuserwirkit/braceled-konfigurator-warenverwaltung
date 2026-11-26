import {
  batchUnitCost,
  buildKpiDashboard,
  inventoryStichtage,
  isoWeek,
  parsePeriod,
  toBerlinDate,
  trailingMonths,
  weeksInRange,
  type KpiQuote,
} from "../lib/kpi/aggregate"

import { parseBetragInput } from "../lib/kpi/betrag-input"

let failed = 0
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg)
    failed++
  } else {
    console.log("ok:", msg)
  }
}

const q = (over: Partial<KpiQuote>): KpiQuote => ({
  id: 1,
  status: "submitted",
  source: "konfigurator",
  modus: "miete",
  menge: 100,
  von: "2026-03-10",
  netto: 1000,
  druckkostenNetto: 0,
  submittedAt: "2026-02-01T10:00:00Z",
  createdAt: "2026-02-01T10:00:00Z",
  approvedAt: null,
  acceptedAt: null,
  paidAt: null,
  rejectionReason: null,
  ...over,
})

const jahr = parsePeriod(undefined, "2026-11-26")
assert(jahr.start === "2026-01-01" && jahr.end === "2027-01-01", "Default-Periode = laufendes Jahr")
const quartal = parsePeriod("2026-Q4", "2026-11-26")
assert(quartal.start === "2026-10-01" && quartal.end === "2027-01-01", "Q4 endet am 01.01. Folgejahr")
const monat = parsePeriod("2026-12", "2026-11-26")
assert(monat.end === "2027-01-01", "Dezember endet am 01.01.")
assert(parsePeriod("quatsch", "2026-11-26").key === "2026", "Ungültige Periode fällt auf Jahr zurück")

assert(isoWeek("2026-01-01").key === "2026-W01", "01.01.2026 (Do) ist KW 1")
assert(isoWeek("2027-01-01").key === "2026-W53", "01.01.2027 (Fr) gehört zu KW 53/2026")
assert(isoWeek("2026-11-26").monday === "2026-11-23", "Montag der KW von 26.11.2026")
assert(weeksInRange("2026-11-01", "2026-12-01").length === 6, "November 2026 überspannt 6 KWs")

assert(toBerlinDate("2026-03-31T22:30:00Z") === "2026-04-01", "UTC-Abend wird Berliner Folgetag (Sommerzeit)")
assert(toBerlinDate("2026-03-10") === "2026-03-10", "Reines Datum bleibt unverändert")

assert(trailingMonths("2027-01-01").join(",").startsWith("2026-01"), "Verlauf: 12 Monate bis Dezember")
assert(trailingMonths("2027-01-01").length === 12, "Verlauf hat 12 Monate")

assert(
  batchUnitCost({ einkaufspreisStueck: 1.89, fracht: 500, zoll: 200, zugangMenge: 7000 }) === 1.99,
  "Stückkosten 1,89 + 700/7000 = 1,99",
)
assert(batchUnitCost({ einkaufspreisStueck: null, fracht: 500, zoll: 0, zugangMenge: 10 }) === null, "Ohne EK kein Stückpreis")
assert(batchUnitCost({ einkaufspreisStueck: 2, fracht: 100, zoll: 0, zugangMenge: 0 }) === 2, "Ohne Zugänge keine Umlage")

assert(
  inventoryStichtage("2026-09-15", "2026-11-26").join(",") === "2026-10-01,2026-11-01",
  "Stichtage nach erster Aktivität bis laufender Monat",
)

const dash = buildKpiDashboard({
  period: jahr,
  bestand: 5000,
  quotes: [
    q({ id: 1 }),
    q({ id: 2, status: "paid", approvedAt: "2026-02-02T00:00:00Z", paidAt: "2026-02-05T00:00:00Z", netto: 2000, druckkostenNetto: 150 }),
    q({ id: 3, status: "approved", approvedAt: "2026-02-02T00:00:00Z", modus: "kauf", menge: 50 }),
    q({ id: 4, status: "rejected", rejectionReason: "Der gewünschte Mietzeitraum ist leider bereits belegt. Schreib uns gern, welche Alternativtermine für dich infrage kommen – wir prüfen das schnell." }),
    q({ id: 5, status: "paid", paidAt: "2025-12-01T00:00:00Z", submittedAt: "2025-11-01T00:00:00Z", von: "2025-12-24" }),
  ],
  costs: [
    { datum: "2026-04-01", kategorie: "einkauf", betrag: 13230 },
    { datum: "2025-04-01", kategorie: "einkauf", betrag: 999 },
  ],
})

assert(dash.anfragen.eingang === 4, "Eingang zählt nur Anfragen im Zeitraum")
assert(dash.anfragen.angebot === 2, "Angebot versendet: bezahlt + approved")
assert(dash.anfragen.bezahlt === 1, "Ein bezahlter Auftrag im Zeitraum")
assert(dash.anfragen.verloren[0]?.grund === "Zeitraum nicht verfügbar", "Ablehnungsgrund wird zum Label")
assert(dash.umsatz.soll === 4000, "Soll = submitted + paid + approved (ohne abgelehnt)")
assert(dash.umsatz.ist === 2000, "Ist = bezahlt")
assert(dash.baender.summe.mieteGebucht === 100 && dash.baender.summe.mieteOffen === 100, "Miete gebucht/offen getrennt")
assert(dash.baender.summe.kaufOffen === 50, "Kauf offen")
const kw11 = dash.baender.wochen.find((w) => w.label === "KW 11")
assert(kw11?.mieteGebucht === 100, "Event am 10.03.2026 landet in KW 11")
assert(dash.kosten.nachKategorie.druck === 150, "Druckkosten bezahlter Aufträge")
assert(dash.kosten.gesamt === 13380, "Kosten nur im Zeitraum")
assert(dash.kosten.ergebnis === 2000 - 13380, "Ergebnis = Ist - Kosten")

assert(parseBetragInput("1,89") === 1.89, "Eingabe 1,89")
assert(parseBetragInput("1.234,56") === 1234.56, "Eingabe 1.234,56")
assert(parseBetragInput("1.500") === 1500, "Eingabe 1.500 = Tausenderpunkt")
assert(parseBetragInput("1.89") === 1.89, "Eingabe 1.89 = Dezimalpunkt")
assert(parseBetragInput("") === null, "Leere Eingabe = null")
assert(Number.isNaN(parseBetragInput("-5")), "Negativ ungültig")
assert(Number.isNaN(parseBetragInput("abc")), "Text ungültig")

if (failed > 0) {
  console.error(`\n${failed} Test(s) fehlgeschlagen`)
  process.exit(1)
}
console.log("\nAlle KPI-Tests bestanden")
