import { resolveMieteBookingWindow } from "../lib/utils/booking"

function assert(c: unknown, m: string) {
  if (!c) throw new Error(m)
}

const missing = resolveMieteBookingWindow({})
assert(!missing.ok, "ohne Ausgabedatum muss ok=false sein")
if (!missing.ok) {
  assert(/Ausgabedatum/i.test(missing.error), `Fehlermeldung soll Ausgabedatum nennen, war: ${missing.error}`)
}

const ausgabe = new Date("2026-11-10T00:00:00")
const withFallback = resolveMieteBookingWindow({ datumAusgabe: ausgabe })
assert(withFallback.ok, "mit Ausgabedatum muss ok=true sein")
if (withFallback.ok) {
  assert(withFallback.ausgabe.getTime() === ausgabe.getTime(), "ausgabe unverändert")
  const expectedEnd = new Date(ausgabe)
  expectedEnd.setDate(expectedEnd.getDate() + 3)
  assert(
    withFallback.rueckgabe.getTime() === expectedEnd.getTime(),
    `Rückgabe-Fallback muss +3 Tage sein, war ${withFallback.rueckgabe.toISOString()}`,
  )
}

const rueckgabe = new Date("2026-11-12T00:00:00")
const both = resolveMieteBookingWindow({ datumAusgabe: ausgabe, datumRueckgabeGeplant: rueckgabe })
assert(both.ok, "mit beiden Daten muss ok=true sein")
if (both.ok) {
  assert(both.rueckgabe.getTime() === rueckgabe.getTime(), "explizite Rückgabe nicht überschreiben")
}

console.log("OK – resolveMieteBookingWindow")
