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

const submit = src("app/api/konfigurator/submit/route.ts")
const warenverwaltung = src("app/warenverwaltung/page.tsx")
const bookingSchema = src("lib/api-schemas.ts")

// Submit: kein Client-Trust für kanalanzahl 40/80
assert(
  !submit.includes("kanalanzahlSchonGesetzt"),
  "submit/route.ts darf keinen kanalanzahlSchonGesetzt Trust-Pfad enthalten",
)
assert(
  /resolveKanalanzahlForConfig\s*\(/.test(submit),
  "submit/route.ts muss resolveKanalanzahlForConfig aufrufen",
)
assert(
  /produkt\s*===\s*["']armband["']\s*\?[\s\S]*?await\s+resolveKanalanzahlForConfig\s*\(\s*rawConfig\s*\)/.test(
    submit,
  ),
  "submit/route.ts muss kanalanzahl für Armband immer via resolveKanalanzahlForConfig setzen",
)

// Ops-Rollen: echte canEdit/canAdmin statt Hardcode
assert(
  /from\s+["']@\/lib\/auth["']/.test(warenverwaltung) &&
    /canEdit/.test(warenverwaltung) &&
    /canAdmin/.test(warenverwaltung),
  "warenverwaltung/page.tsx muss canEdit und canAdmin aus @/lib/auth importieren/nutzen",
)
assert(
  !/userCanEdit\s*=\s*true/.test(warenverwaltung),
  "warenverwaltung/page.tsx darf userCanEdit nicht hardcoden (= true)",
)
assert(
  !/userCanAdmin\s*=\s*true/.test(warenverwaltung),
  "warenverwaltung/page.tsx darf userCanAdmin nicht hardcoden (= true)",
)

// Booking-API: kanalanzahl im Schema (optional)
assert(
  /bookingRequestSchema\s*=\s*z\.object\(\{[\s\S]*?kanalanzahl[\s\S]*?\}\)/.test(bookingSchema),
  "bookingRequestSchema muss optionales kanalanzahl-Feld enthalten",
)

console.log("OK – submit/roles hardening contracts")
