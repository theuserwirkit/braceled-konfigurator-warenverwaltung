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

const n8n = src("lib/actions/n8n-api.ts")
assert(/kanalanzahl\?:\s*number/.test(n8n), "N8nBookingRequest muss kanalanzahl haben")
assert(
  /resolveGroupsForProduct\(produkt,\s*kanalanzahl\)/.test(n8n),
  "findBestAllocation muss resolveGroupsForProduct mit kanalanzahl rufen",
)
assert(
  /findBestAllocation\(produkt,\s*menge,\s*ausgabe,\s*rueckgabe,\s*kanalanzahl\)/.test(n8n),
  "findBestAllocation Signatur inkl. kanalanzahl",
)

const hold = src("lib/actions/quote-booking-internal.ts")
assert(
  /createN8nBooking\(\{[\s\S]*kanalanzahl/.test(hold),
  "createQuoteHoldBooking muss kanalanzahl an createN8nBooking übergeben",
)

const quotes = src("lib/quotes-internal.ts")
assert(
  /checkProductAvailability\(\{[\s\S]*kanalanzahl/.test(quotes),
  "revalidateAvailability muss kanalanzahl übergeben",
)

console.log("OK – kanalanzahl wiring contracts")
