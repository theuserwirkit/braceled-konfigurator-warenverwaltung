import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
function src(rel: string) {
  return readFileSync(join(root, rel), "utf8")
}
function assert(c: unknown, m: string) {
  if (!c) throw new Error(m)
}

/**
 * Extrahiert den alleinstehenden if (input.bookingType === "TYPE") { ... }-Block
 * (nicht else-if mit || …), inkl. verschachtelter Klammern.
 */
function bookingTypeBlock(source: string, bookingType: string): string | null {
  const re = new RegExp(
    `if\\s*\\(\\s*input\\.bookingType\\s*===\\s*"${bookingType}"\\s*\\)`,
  )
  const match = re.exec(source)
  if (!match || match.index === undefined) return null
  const idx = match.index
  const braceStart = source.indexOf("{", idx)
  if (braceStart < 0) return null
  let depth = 0
  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i]
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return source.slice(idx, i + 1)
    }
  }
  return null
}

const bookingsInternal = src("lib/actions/bookings-internal.ts")

assert(
  /getAvailabilityForGroupBatchesByDateRange/.test(bookingsInternal),
  "bookings-internal muss getAvailabilityForGroupBatchesByDateRange importieren/nutzen",
)

assert(
  /getAvailabilityForGroupInternal/.test(bookingsInternal),
  "bookings-internal muss getAvailabilityForGroupInternal weiter für VERKAUF nutzen",
)

const verkaufBlock = bookingTypeBlock(bookingsInternal, "VERKAUF")
assert(verkaufBlock, "createBookingInternal braucht einen eigenen VERKAUF-Verfügbarkeitsblock")
assert(
  /getAvailabilityForGroupInternal/.test(verkaufBlock!),
  "VERKAUF-Pfad muss getAvailabilityForGroupInternal referenzieren",
)
assert(
  !/getAvailabilityForGroupBatchesByDateRange/.test(verkaufBlock!),
  "VERKAUF-Pfad darf keine Datumsbereich-Verfügbarkeit nutzen",
)

assert(
  /resolveMieteBookingWindow/.test(bookingsInternal),
  "bookings-internal muss resolveMieteBookingWindow für das kanonische Miet-Fenster nutzen",
)

const mieteBlock = bookingTypeBlock(bookingsInternal, "MIETE_AUSGABE")
assert(mieteBlock, "createBookingInternal braucht einen eigenen MIETE_AUSGABE-Verfügbarkeitsblock")
assert(
  /resolveMieteBookingWindow/.test(mieteBlock!),
  "MIETE_AUSGABE-Pfad muss resolveMieteBookingWindow aufrufen (Ausgabedatum Pflicht, +3-Tage-Fallback)",
)
assert(
  /getAvailabilityForGroupBatchesByDateRange/.test(mieteBlock!),
  "MIETE_AUSGABE-Pfad muss getAvailabilityForGroupBatchesByDateRange (Kalender+Buffer) referenzieren",
)
assert(
  /datumAusgabe|ausgabe/.test(mieteBlock!) && /datumRueckgabe|rueckgabe/.test(mieteBlock!),
  "MIETE_AUSGABE-Pfad muss Buchungsdaten (Ausgabe/Rückgabe) für den Datumsbereich nutzen",
)

// Lock-Key-Zweig (else if VERKAUF || MIETE_AUSGABE) darf den Verfügbarkeits-Miete-Block nicht „ersetzen“:
// es muss mindestens ein MIETE_AUSGABE-Block die Datumsbereich-API nutzen.
assert(
  /getAvailabilityForGroupBatchesByDateRange/.test(mieteBlock!),
  "MIETE_AUSGABE Verfügbarkeitscheck unter Lock = Kalender-Semantik",
)

console.log("OK – Miet-Lock Kalender-Semantik contracts")
