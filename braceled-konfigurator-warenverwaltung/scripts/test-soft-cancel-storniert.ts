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

const quoteBooking = src("lib/actions/quote-booking-internal.ts")
const bookings = src("lib/actions/bookings.ts")
const types = src("lib/types.ts")

// releaseQuoteBooking: Soft-Cancel via UPDATE STORNIERT, nicht hartes DELETE
const releaseFn = quoteBooking.match(
  /export async function releaseQuoteBooking[\s\S]*?(?=\nexport async function |\n$)/,
)?.[0]
assert(releaseFn, "releaseQuoteBooking muss existieren")
assert(
  /UPDATE\s+bookings\s+SET\s+status\s*=\s*['"]STORNIERT['"]/i.test(releaseFn!),
  "releaseQuoteBooking muss bookings.status auf STORNIERT setzen (UPDATE)",
)
assert(
  !/DELETE\s+FROM\s+bookings/i.test(releaseFn!),
  "releaseQuoteBooking darf bookings nicht per DELETE entfernen (Soft-Cancel)",
)
assert(
  /revalidateBookingPaths\s*\(/.test(releaseFn!),
  "releaseQuoteBooking muss revalidateBookingPaths behalten",
)

// Datumsbereich-Verfügbarkeit: MIETE_AUSGABE ignoriert STORNIERT
assert(
  /STORNIERT/.test(bookings) &&
    /getAvailabilityForGroupBatchesByDateRange[\s\S]*?STORNIERT/.test(bookings),
  "getAvailabilityForGroupBatchesByDateRange muss STORNIERT-Mieten ausschließen",
)

// Stock-Berechnung (ZUGANG/VERKAUF/Defekt) muss STORNIERT ebenfalls ausschließen
const batchRangeFn = bookings.match(
  /export async function getAvailabilityForGroupBatchesByDateRange[\s\S]*?(?=\n\/\/ Shared helper|\nexport async function getAvailabilityForGroupByDateRange)/,
)?.[0]
assert(batchRangeFn, "getAvailabilityForGroupBatchesByDateRange muss existieren")
const stockBlock = batchRangeFn!.match(
  /const stockRows = await sql`[\s\S]*?`/,
)?.[0]
assert(stockBlock, "stockRows-Query in getAvailabilityForGroupBatchesByDateRange muss existieren")
assert(
  /status\s+IS\s+DISTINCT\s+FROM\s+['"]STORNIERT['"]/i.test(stockBlock!),
  "stockRows muss STORNIERT-Buchungen ausschließen (sonst bleiben stornierte VERKAUF negativ im Bestand)",
)

const baseRangeFn = bookings.match(
  /export async function getBaseAvailabilityByDateRangeInternal[\s\S]*?(?=\nexport async function getBaseAvailabilityByDateRange\b)/,
)?.[0]
assert(baseRangeFn, "getBaseAvailabilityByDateRangeInternal muss existieren")
const baseStockBlock = baseRangeFn!.match(
  /const stockItems = await sql`[\s\S]*?`/,
)?.[0]
assert(baseStockBlock, "stockItems-Query in getBaseAvailabilityByDateRangeInternal muss existieren")
assert(
  /status\s+IS\s+DISTINCT\s+FROM\s+['"]STORNIERT['"]/i.test(baseStockBlock!),
  "getBaseAvailabilityByDateRangeInternal stockItems muss STORNIERT ausschließen",
)

const calendarFn = bookings.match(
  /export async function getCalendarData[\s\S]*?(?=\nexport async function )/,
)?.[0]
assert(calendarFn, "getCalendarData muss existieren")
assert(
  /const bandStock = await sql`[\s\S]*?status\s+IS\s+DISTINCT\s+FROM\s+['"]STORNIERT['"]/i.test(calendarFn!),
  "getCalendarData bandStock muss STORNIERT ausschließen",
)
assert(
  /const baseStock = await sql`[\s\S]*?status\s+IS\s+DISTINCT\s+FROM\s+['"]STORNIERT['"]/i.test(calendarFn!),
  "getCalendarData baseStock muss STORNIERT ausschließen",
)

// BookingStatus umfasst STORNIERT
assert(
  /export type BookingStatus\s*=\s*"[^"]+"\s*\|\s*"[^"]+"\s*\|\s*"STORNIERT"/.test(types) ||
    /export type BookingStatus\s*=[\s\S]*?STORNIERT/.test(types),
  'BookingStatus muss "STORNIERT" enthalten',
)

// getRentedItemsByGroupInternal: Soft-Cancels zählen nicht als vermietet
const rentedFn = bookings.match(
  /export async function getRentedItemsByGroupInternal[\s\S]*?(?=\nexport async function |\n$)/,
)?.[0]
assert(rentedFn, "getRentedItemsByGroupInternal muss existieren")
assert(
  /status\s+IS\s+DISTINCT\s+FROM\s+['"]STORNIERT['"]/i.test(rentedFn!),
  "getRentedItemsByGroupInternal muss STORNIERT-Buchungen ausschließen",
)

console.log("OK – Soft-Cancel STORNIERT contracts")
