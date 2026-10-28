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

const apiAuth = src("lib/api-auth.ts")
const approve = src("app/api/quote-requests/[id]/approve/route.ts")
const reject = src("app/api/quote-requests/[id]/reject/route.ts")
const telegram = src("app/api/telegram/webhook/route.ts")
const availability = src("app/api/availability/route.ts")
const bookings = src("app/api/bookings/route.ts")
const quoteList = src("app/api/quote-requests/route.ts")
const quoteGet = src("app/api/quote-requests/[id]/route.ts")
const envExample = src("env.konfigurator.example")

assert(
  /export function verifyApiKey\s*\(/.test(apiAuth),
  "lib/api-auth.ts muss verifyApiKey exportieren",
)
assert(
  /export function verifyApiKeyApprove\s*\(/.test(apiAuth),
  "lib/api-auth.ts muss verifyApiKeyApprove exportieren",
)
assert(
  /WRISTLINK_API_KEY_APPROVE/.test(apiAuth),
  "verifyApiKeyApprove muss WRISTLINK_API_KEY_APPROVE lesen",
)
assert(
  /timingSafeEqual/.test(apiAuth),
  "lib/api-auth.ts muss timing-safe Vergleich nutzen",
)
assert(
  /export function unauthorizedResponse/.test(apiAuth),
  "unauthorizedResponse muss weiterhin exportiert werden",
)

// Approve-Key darf den Automation-Key nicht akzeptieren:
// getApiKeyApprove / verifyApiKeyApprove dürfen nicht auf WRISTLINK_API_KEY
// (ohne _APPROVE) zurückfallen.
const approveFnMatch = apiAuth.match(
  /function getApiKeyApprove\s*\(\)[\s\S]*?(?=\nfunction |\nexport )/,
)
assert(approveFnMatch, "getApiKeyApprove muss definiert sein")
assert(
  !/\bWRISTLINK_API_KEY\b(?!_APPROVE)/.test(approveFnMatch![0]),
  "getApiKeyApprove darf nicht auf WRISTLINK_API_KEY zurückfallen",
)

const verifyApproveMatch = apiAuth.match(
  /export function verifyApiKeyApprove\s*\([\s\S]*?(?=\nexport |\n$)/,
)
assert(verifyApproveMatch, "verifyApiKeyApprove-Body nicht gefunden")
assert(
  /getApiKeyApprove\s*\(/.test(verifyApproveMatch![0]),
  "verifyApiKeyApprove muss getApiKeyApprove nutzen",
)
assert(
  !/\bgetApiKey\s*\(/.test(verifyApproveMatch![0]),
  "verifyApiKeyApprove darf getApiKey (Automation) nicht nutzen",
)

assert(
  /verifyApiKeyApprove/.test(approve) && !/\bverifyApiKey\s*\(/.test(approve),
  "approve/route.ts muss verifyApiKeyApprove nutzen (nicht verifyApiKey)",
)
assert(
  /verifyApiKeyApprove/.test(reject) && !/\bverifyApiKey\s*\(/.test(reject),
  "reject/route.ts muss verifyApiKeyApprove nutzen (nicht verifyApiKey)",
)

assert(
  /\bverifyApiKey\s*\(/.test(availability),
  "availability muss weiterhin verifyApiKey nutzen",
)
assert(
  /\bverifyApiKey\s*\(/.test(bookings),
  "bookings muss weiterhin verifyApiKey nutzen",
)
assert(
  /\bverifyApiKey\s*\(/.test(quoteList),
  "quote-requests POST/list muss weiterhin verifyApiKey nutzen",
)
assert(
  /\bverifyApiKey\s*\(/.test(quoteGet),
  "quote-requests/[id] GET muss weiterhin verifyApiKey nutzen",
)

assert(
  /TELEGRAM_WEBHOOK_SECRET/.test(telegram) && !/verifyApiKey/.test(telegram),
  "Telegram-Webhook muss TELEGRAM_WEBHOOK_SECRET behalten (kein API-Key)",
)

assert(
  /WRISTLINK_API_KEY=/.test(envExample),
  "env.konfigurator.example muss WRISTLINK_API_KEY dokumentieren",
)
assert(
  /WRISTLINK_API_KEY_APPROVE=/.test(envExample),
  "env.konfigurator.example muss WRISTLINK_API_KEY_APPROVE dokumentieren",
)

console.log("OK – security remediation apikey (Fix 7) contracts")
