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

const leads = src("lib/actions/leads.ts")
const leadsInternal = src("lib/actions/leads-internal.ts")
const quotes = src("lib/actions/quotes.ts")
const bookings = src("lib/actions/bookings.ts")
const emailTemplates = src("lib/actions/email-templates.ts")
const angebotPage = src("app/angebot/[token]/page.tsx")
const testmodeRoute = src("app/api/konfigurator/testmode/route.ts")

// Fix 1 — getOrCreateVerifiedLeadForEmail nicht als Server Action
assert(
  !/export\s+async\s+function\s+getOrCreateVerifiedLeadForEmail/.test(leads),
  "leads.ts darf getOrCreateVerifiedLeadForEmail nicht exportieren",
)
assert(
  /import\s+["']server-only["']/.test(leadsInternal),
  "leads-internal.ts muss import \"server-only\" enthalten",
)
assert(
  /export\s+async\s+function\s+getOrCreateVerifiedLeadForEmail/.test(leadsInternal),
  "leads-internal.ts muss getOrCreateVerifiedLeadForEmail exportieren",
)

// Fix 2 — Fulfillment IDOR: Token + PLZ-Gate statt quoteId
assert(
  /export\s+async\s+function\s+getPublicFulfillmentEvents\s*\(\s*publicToken\s*:\s*string\s*\)/.test(
    quotes,
  ),
  "getPublicFulfillmentEvents muss publicToken: string entgegennehmen",
)
assert(
  /hasAngebotAccess\s*\(/.test(quotes) &&
    /getPublicFulfillmentEvents[\s\S]*?hasAngebotAccess/.test(quotes),
  "getPublicFulfillmentEvents muss hasAngebotAccess prüfen",
)
assert(
  /getPublicFulfillmentEvents\s*\(\s*token\s*\)/.test(angebotPage),
  "angebot/[token]/page.tsx muss getPublicFulfillmentEvents(token) aufrufen",
)
assert(
  !/getPublicFulfillmentEvents\s*\(\s*quote\.id\s*\)/.test(angebotPage),
  "angebot/[token]/page.tsx darf getPublicFulfillmentEvents(quote.id) nicht mehr nutzen",
)

// Fix 3 — Auth auf Stats + kein bare Template-Re-Export
assert(
  /export\s+async\s+function\s+getQuoteRequestStats[\s\S]*?await\s+requireRole\s*\(\s*\[\s*["']ADMIN["']\s*\]\s*\)/.test(
    quotes,
  ),
  "getQuoteRequestStats muss requireRole([\"ADMIN\"]) aufrufen",
)
assert(
  /export\s+async\s+function\s+getTotalStats\s*\(\s*\)\s*\{[\s\S]*?await\s+ensureAuthed\s*\(\s*\)/.test(
    bookings,
  ),
  "getTotalStats muss ensureAuthed() aufrufen",
)
assert(
  /export\s+async\s+function\s+getBaseTotalStats\s*\(\s*\)\s*\{[\s\S]*?await\s+ensureAuthed\s*\(\s*\)/.test(
    bookings,
  ),
  "getBaseTotalStats muss ensureAuthed() aufrufen",
)
assert(
  !/export\s*\{\s*getEmailTemplateByKey\s*\}/.test(emailTemplates),
  "email-templates.ts darf getEmailTemplateByKey nicht re-exportieren",
)

// Fix 4 — Testmode Secret in Production-Pfad der Action
assert(
  /KONFIGURATOR_TESTMODE_SECRET/.test(leads),
  "bypassEmailVerificationForTestmode muss KONFIGURATOR_TESTMODE_SECRET prüfen",
)
assert(
  /bypassEmailVerificationForTestmode\s*\(/.test(testmodeRoute) &&
    (/secret/.test(testmodeRoute) || /x-testmode-secret/.test(testmodeRoute)),
  "testmode/route.ts muss das Secret in bypassEmailVerificationForTestmode durchreichen",
)

console.log("OK – security remediation actions contracts")
