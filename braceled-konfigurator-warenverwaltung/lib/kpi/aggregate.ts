import type { QuoteStatus } from "@/lib/konfigurator/types"
import { REJECTION_REASONS } from "@/lib/konfigurator/rejection-reasons"

export type KpiPeriodTyp = "jahr" | "quartal" | "monat"

export type KpiPeriod = {
  key: string
  typ: KpiPeriodTyp
  label: string
  /** inklusiv, YYYY-MM-DD */
  start: string
  /** exklusiv, YYYY-MM-DD */
  end: string
}

export type KpiQuote = {
  id: number
  status: QuoteStatus
  source: string
  modus: string | null
  menge: number
  von: string | null
  netto: number
  druckkostenNetto: number
  submittedAt: string | null
  createdAt: string
  approvedAt: string | null
  acceptedAt: string | null
  paidAt: string | null
  rejectionReason: string | null
}

export type KpiCostKategorie = "einkauf" | "fracht" | "zoll" | "basen" | "druck"

export type KpiCostEntry = {
  datum: string
  kategorie: KpiCostKategorie
  betrag: number
}

export const COST_KATEGORIE_LABELS: Record<KpiCostKategorie, string> = {
  einkauf: "Einkauf Bänder",
  fracht: "Fracht",
  zoll: "Zoll",
  basen: "Einkauf Basen",
  druck: "Druck",
}

const MONTH_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
const MONTH_LONG = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
]

const OPEN_STATUSES: QuoteStatus[] = ["submitted", "approved", "payment_pending"]
const SOLL_STATUSES: QuoteStatus[] = [...OPEN_STATUSES, "paid"]

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function ymd(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

const berlinDateFormat = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

/** Kalenderdatum (YYYY-MM-DD) in Europe/Berlin; reine Datumsstrings bleiben unverändert. */
export function toBerlinDate(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return berlinDateFormat.format(typeof value === "string" ? new Date(value) : value)
}

export function monthKey(date: string): string {
  return date.slice(0, 7)
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number)
  return `${MONTH_SHORT[m - 1]} ${String(y).slice(2)}`
}

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const idx = year * 12 + (month - 1) + delta
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 }
}

export function parsePeriod(param: string | undefined, today: string): KpiPeriod {
  const value = param?.trim() ?? ""

  const monat = value.match(/^(\d{4})-(\d{2})$/)
  if (monat) {
    const year = Number(monat[1])
    const month = Number(monat[2])
    if (month >= 1 && month <= 12) {
      const next = addMonths(year, month, 1)
      return {
        key: value,
        typ: "monat",
        label: `${MONTH_LONG[month - 1]} ${year}`,
        start: ymd(year, month, 1),
        end: ymd(next.year, next.month, 1),
      }
    }
  }

  const quartal = value.match(/^(\d{4})-Q([1-4])$/)
  if (quartal) {
    const year = Number(quartal[1])
    const q = Number(quartal[2])
    const startMonth = (q - 1) * 3 + 1
    const next = addMonths(year, startMonth, 3)
    return {
      key: value,
      typ: "quartal",
      label: `Q${q} ${year}`,
      start: ymd(year, startMonth, 1),
      end: ymd(next.year, next.month, 1),
    }
  }

  const jahr = value.match(/^(\d{4})$/)
  const year = jahr ? Number(jahr[1]) : Number(today.slice(0, 4))
  return {
    key: String(year),
    typ: "jahr",
    label: `Jahr ${year}`,
    start: ymd(year, 1, 1),
    end: ymd(year + 1, 1, 1),
  }
}

export function monthsInRange(start: string, end: string): string[] {
  const keys: string[] = []
  let [y, m] = start.split("-").map(Number)
  while (ymd(y, m, 1) < end) {
    keys.push(`${y}-${pad2(m)}`)
    const next = addMonths(y, m, 1)
    y = next.year
    m = next.month
  }
  return keys
}

/** Die 12 Monate, die mit dem Monat vor `end` (exklusiv) enden. */
export function trailingMonths(end: string, count = 12): string[] {
  const [y, m] = end.split("-").map(Number)
  const first = addMonths(y, m, -count)
  return monthsInRange(ymd(first.year, first.month, 1), ymd(y, m, 1))
}

function utcDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function formatUtcDate(date: Date): string {
  return ymd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

/** ISO-8601-Kalenderwoche: Schlüssel `2026-W48`, Montag der Woche als `monday`. */
export function isoWeek(date: string): { key: string; week: number; monday: string } {
  const d = utcDate(date)
  const weekday = (d.getUTCDay() + 6) % 7
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() - weekday)
  const thursday = new Date(monday)
  thursday.setUTCDate(monday.getUTCDate() + 3)
  const isoYear = thursday.getUTCFullYear()
  const jan4 = new Date(Date.UTC(isoYear, 0, 4))
  const jan4Monday = new Date(jan4)
  jan4Monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7))
  const week = Math.round((monday.getTime() - jan4Monday.getTime()) / (7 * 86400000)) + 1
  return { key: `${isoYear}-W${pad2(week)}`, week, monday: formatUtcDate(monday) }
}

export function weeksInRange(start: string, end: string): Array<{ key: string; week: number; monday: string }> {
  const weeks: Array<{ key: string; week: number; monday: string }> = []
  const cursor = utcDate(isoWeek(start).monday)
  const endDate = utcDate(end)
  while (cursor < endDate) {
    weeks.push(isoWeek(formatUtcDate(cursor)))
    cursor.setUTCDate(cursor.getUTCDate() + 7)
  }
  return weeks
}

/** Anschaffungskosten pro Stück: Einkaufspreis + anteilige Fracht und Zoll. */
export function batchUnitCost(input: {
  einkaufspreisStueck: number | null
  fracht: number | null
  zoll: number | null
  zugangMenge: number
}): number | null {
  if (input.einkaufspreisStueck == null) return null
  const nebenkosten = (input.fracht ?? 0) + (input.zoll ?? 0)
  const anteil = input.zugangMenge > 0 ? nebenkosten / input.zugangMenge : 0
  return Math.round((input.einkaufspreisStueck + anteil) * 10000) / 10000
}

export function quoteEventDate(q: KpiQuote): string {
  return q.von ? toBerlinDate(q.von) : toBerlinDate(q.paidAt ?? q.submittedAt ?? q.createdAt)
}

export function quoteEingangDate(q: KpiQuote): string {
  return toBerlinDate(q.submittedAt ?? q.createdAt)
}

function inRange(date: string, period: { start: string; end: string }): boolean {
  return date >= period.start && date < period.end
}

const isPaid = (q: KpiQuote) => q.status === "paid"
const reachedAngebot = (q: KpiQuote) =>
  Boolean(q.approvedAt) || ["approved", "payment_pending", "paid"].includes(q.status)
const reachedAngenommen = (q: KpiQuote) =>
  Boolean(q.acceptedAt) || ["payment_pending", "paid"].includes(q.status)
const reachedBezahlt = (q: KpiQuote) => Boolean(q.paidAt) || q.status === "paid"

function reasonLabel(reason: string | null, status: QuoteStatus): string {
  if (!reason) return status === "expired" ? "Abgelaufen" : "Ohne Angabe"
  const known = REJECTION_REASONS.find((r) => r.message === reason || r.id === reason)
  return known?.label ?? reason
}

export type KpiDashboard = {
  anfragen: {
    eingang: number
    angebot: number
    angenommen: number
    bezahlt: number
    abschlussquote: number
    nachQuelle: Array<{ quelle: string; anzahl: number }>
    verloren: Array<{ grund: string; status: QuoteStatus; anzahl: number }>
    verlauf: Array<{ monat: string; label: string; eingang: number; bezahlt: number }>
  }
  baender: {
    wochen: Array<{
      key: string
      label: string
      mieteGebucht: number
      mieteOffen: number
      kaufGebucht: number
      kaufOffen: number
    }>
    summe: { mieteGebucht: number; mieteOffen: number; kaufGebucht: number; kaufOffen: number }
    bestand: number
  }
  umsatz: {
    monate: Array<{ monat: string; label: string; soll: number; ist: number }>
    soll: number
    ist: number
    quote: number
    auftraegeBezahlt: number
    durchschnittAuftrag: number
  }
  kosten: {
    monate: Array<{ monat: string; label: string } & Record<KpiCostKategorie, number>>
    nachKategorie: Record<KpiCostKategorie, number>
    gesamt: number
    ergebnis: number
  }
}

function emptyCostRecord(): Record<KpiCostKategorie, number> {
  return { einkauf: 0, fracht: 0, zoll: 0, basen: 0, druck: 0 }
}

export function buildKpiDashboard(input: {
  period: KpiPeriod
  quotes: KpiQuote[]
  costs: KpiCostEntry[]
  bestand: number
}): KpiDashboard {
  const { period, quotes, bestand } = input

  const eingangQuotes = quotes.filter((q) => inRange(quoteEingangDate(q), period))
  const eingang = eingangQuotes.length
  const bezahlt = eingangQuotes.filter(reachedBezahlt).length

  const quelleMap = new Map<string, number>()
  const verlorenMap = new Map<string, { grund: string; status: QuoteStatus; anzahl: number }>()
  for (const q of eingangQuotes) {
    quelleMap.set(q.source, (quelleMap.get(q.source) ?? 0) + 1)
    if (q.status === "rejected" || q.status === "cancelled" || q.status === "expired") {
      const grund = reasonLabel(q.rejectionReason, q.status)
      const key = `${q.status}:${grund}`
      const entry = verlorenMap.get(key) ?? { grund, status: q.status, anzahl: 0 }
      entry.anzahl++
      verlorenMap.set(key, entry)
    }
  }

  const verlaufMonate = trailingMonths(period.end)
  const verlauf = verlaufMonate.map((monat) => {
    const imMonat = quotes.filter((q) => monthKey(quoteEingangDate(q)) === monat)
    return {
      monat,
      label: monthLabel(monat),
      eingang: imMonat.length,
      bezahlt: imMonat.filter(reachedBezahlt).length,
    }
  })

  const eventQuotes = quotes.filter((q) => inRange(quoteEventDate(q), period))

  const wochenListe = weeksInRange(period.start, period.end)
  const wochenMap = new Map(
    wochenListe.map((w) => [
      w.key,
      { key: w.key, label: `KW ${w.week}`, mieteGebucht: 0, mieteOffen: 0, kaufGebucht: 0, kaufOffen: 0 },
    ]),
  )
  const baenderSumme = { mieteGebucht: 0, mieteOffen: 0, kaufGebucht: 0, kaufOffen: 0 }
  for (const q of eventQuotes) {
    const gebucht = isPaid(q)
    if (!gebucht && !OPEN_STATUSES.includes(q.status)) continue
    const field = `${q.modus === "kauf" ? "kauf" : "miete"}${gebucht ? "Gebucht" : "Offen"}` as keyof typeof baenderSumme
    const woche = wochenMap.get(isoWeek(quoteEventDate(q)).key)
    if (woche) woche[field] += q.menge
    baenderSumme[field] += q.menge
  }

  const monate = monthsInRange(period.start, period.end)
  const umsatzMonate = monate.map((monat) => ({ monat, label: monthLabel(monat), soll: 0, ist: 0 }))
  const umsatzIndex = new Map(umsatzMonate.map((m) => [m.monat, m]))
  for (const q of eventQuotes) {
    const row = umsatzIndex.get(monthKey(quoteEventDate(q)))
    if (!row) continue
    if (SOLL_STATUSES.includes(q.status)) row.soll += q.netto
    if (isPaid(q)) row.ist += q.netto
  }
  for (const row of umsatzMonate) {
    row.soll = round2(row.soll)
    row.ist = round2(row.ist)
  }
  const soll = round2(umsatzMonate.reduce((s, m) => s + m.soll, 0))
  const ist = round2(umsatzMonate.reduce((s, m) => s + m.ist, 0))
  const auftraegeBezahlt = eventQuotes.filter(isPaid).length

  const kostenMonate = monate.map((monat) => ({ monat, label: monthLabel(monat), ...emptyCostRecord() }))
  const kostenIndex = new Map(kostenMonate.map((m) => [m.monat, m]))
  const nachKategorie = emptyCostRecord()
  const druckEntries: KpiCostEntry[] = eventQuotes
    .filter((q) => isPaid(q) && q.druckkostenNetto > 0)
    .map((q) => ({ datum: quoteEventDate(q), kategorie: "druck", betrag: q.druckkostenNetto }))
  for (const entry of [...input.costs, ...druckEntries]) {
    if (!inRange(entry.datum, period)) continue
    const row = kostenIndex.get(monthKey(entry.datum))
    if (row) row[entry.kategorie] = round2(row[entry.kategorie] + entry.betrag)
    nachKategorie[entry.kategorie] = round2(nachKategorie[entry.kategorie] + entry.betrag)
  }
  const kostenGesamt = round2(Object.values(nachKategorie).reduce((s, v) => s + v, 0))

  return {
    anfragen: {
      eingang,
      angebot: eingangQuotes.filter(reachedAngebot).length,
      angenommen: eingangQuotes.filter(reachedAngenommen).length,
      bezahlt,
      abschlussquote: eingang > 0 ? bezahlt / eingang : 0,
      nachQuelle: Array.from(quelleMap, ([quelle, anzahl]) => ({ quelle, anzahl })).sort(
        (a, b) => b.anzahl - a.anzahl,
      ),
      verloren: Array.from(verlorenMap.values()).sort((a, b) => b.anzahl - a.anzahl),
      verlauf,
    },
    baender: { wochen: Array.from(wochenMap.values()), summe: baenderSumme, bestand },
    umsatz: {
      monate: umsatzMonate,
      soll,
      ist,
      quote: soll > 0 ? ist / soll : 0,
      auftraegeBezahlt,
      durchschnittAuftrag: auftraegeBezahlt > 0 ? round2(ist / auftraegeBezahlt) : 0,
    },
    kosten: {
      monate: kostenMonate,
      nachKategorie,
      gesamt: kostenGesamt,
      ergebnis: round2(ist - kostenGesamt),
    },
  }
}

/** Alle Monatsersten (YYYY-MM-01) nach `firstActivity` bis einschließlich zum aktuellen Monat. */
export function inventoryStichtage(firstActivity: string, today: string): string[] {
  const [fy, fm] = firstActivity.split("-").map(Number)
  const first = addMonths(fy, fm, 1)
  const [ty, tm] = today.split("-").map(Number)
  const next = addMonths(ty, tm, 1)
  return monthsInRange(ymd(first.year, first.month, 1), ymd(next.year, next.month, 1)).map((m) => `${m}-01`)
}

export function formatStichtag(stichtag: string): string {
  const [y, m, d] = stichtag.split("-")
  return `${d}.${m}.${y}`
}
