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

const quotes = src("lib/quotes-internal.ts")
const webhook = src("app/api/stripe/webhook/route.ts")

const processPaidMatch = quotes.match(
  /export async function processPaidQuote[\s\S]*?(?=\nexport async function )/,
)
assert(processPaidMatch, "processPaidQuote muss in lib/quotes-internal.ts existieren")
const processPaid = processPaidMatch![0]

// Idempotenz-Check vor Finalize
assert(
  /SELECT[\s\S]*stripe_webhook_events[\s\S]*finalizeQuoteAsPaid/.test(processPaid),
  "processPaidQuote muss event_id in stripe_webhook_events prüfen, bevor finalizeQuoteAsPaid läuft",
)

// INSERT erst nach Finalize-Erfolgspfad
const finalizeIdx = processPaid.search(/finalizeQuoteAsPaid\s*\(/)
const insertIdx = processPaid.search(/INSERT\s+INTO\s+stripe_webhook_events/)
assert(finalizeIdx >= 0, "processPaidQuote muss finalizeQuoteAsPaid aufrufen")
assert(insertIdx >= 0, "processPaidQuote muss INSERT INTO stripe_webhook_events enthalten")
assert(
  insertIdx > finalizeIdx,
  "INSERT stripe_webhook_events muss nach finalizeQuoteAsPaid im Erfolgspfad stehen (event_id nicht vorzeitig konsumieren)",
)

assert(
  /if\s*\(\s*!result\.success\s*\)/.test(processPaid) ||
    /if\s*\(\s*!result\.success\s*\)\s*\{[\s\S]*?return\s+result/.test(processPaid),
  "processPaidQuote darf event_id bei finalize-Fehler nicht inserten (early return bei !result.success)",
)

// Webhook: non-2xx bei Fehler, 200 bei Erfolg / alreadyProcessed
assert(
  /success\s*===\s*false/.test(webhook),
  "Webhook-Route muss processPaidQuote success:false prüfen",
)
assert(
  /status:\s*50[03]/.test(webhook),
  "Webhook-Route muss bei Finalize-Fehler HTTP 500/503 zurückgeben (Stripe-Retry)",
)
assert(
  /catch\s*\([^)]*\)\s*\{[\s\S]*?status:\s*50[03]/.test(webhook),
  "Webhook-Route muss bei throw ebenfalls HTTP 5xx zurückgeben",
)
assert(
  /alreadyProcessed/.test(webhook) && /received:\s*true/.test(webhook),
  "Webhook-Route muss alreadyProcessed / Erfolg weiterhin mit 200 beantworten",
)

console.log("OK – security remediation stripe webhook contracts")
