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

/** Text from `if (NODE_ENV === "production")` through the matching closing brace of that if-block. */
function productionIfBlock(source: string, anchor: string): string {
  const anchorIdx = source.indexOf(anchor)
  assert(anchorIdx >= 0, `${anchor}: Anker nicht gefunden`)
  const prodNeedle = 'NODE_ENV === "production"'
  const prodIdx = source.indexOf(prodNeedle, anchorIdx)
  assert(prodIdx >= 0 && prodIdx < anchorIdx + 4000, `${anchor}: Production-Zweig fehlt`)

  const openBrace = source.indexOf("{", prodIdx)
  assert(openBrace >= 0, `${anchor}: Production-if ohne Block`)

  let depth = 0
  for (let i = openBrace; i < source.length; i++) {
    const ch = source[i]
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) {
        return source.slice(prodIdx, i + 1)
      }
    }
  }
  throw new Error(`${anchor}: Production-Block nicht abgeschlossen`)
}

function assertProductionNoPasswordFallback(source: string, anchor: string) {
  const block = productionIfBlock(source, anchor)
  assert(
    !block.includes("WRISTLINK_PASSWORD"),
    `${anchor}: Production-Zweig darf nicht auf WRISTLINK_PASSWORD zurückfallen`,
  )
}

function assertNonProductionPasswordFallback(source: string, anchor: string) {
  const anchorIdx = source.indexOf(anchor)
  assert(anchorIdx >= 0, `${anchor}: Anker nicht gefunden`)
  const tail = source.slice(anchorIdx, anchorIdx + 4000)
  assert(
    /WRISTLINK_PASSWORD/.test(tail),
    `${anchor}: Nicht-Production muss weiterhin WRISTLINK_PASSWORD-Fallback erlauben`,
  )
}

const authCore = src("lib/auth-core.ts")
const middleware = src("middleware.ts")
const leadAuth = src("lib/konfigurator/lead-auth.ts")
const angebotAccess = src("lib/konfigurator/angebot-access.ts")
const envExample = src("env.konfigurator.example")

assertProductionNoPasswordFallback(authCore, "export function getSessionSecret")
assertNonProductionPasswordFallback(authCore, "export function getSessionSecret")

assertProductionNoPasswordFallback(middleware, "function getSessionSecret")
assertNonProductionPasswordFallback(middleware, "function getSessionSecret")

assertProductionNoPasswordFallback(leadAuth, "function getLeadSecret")
assertNonProductionPasswordFallback(leadAuth, "function getLeadSecret")

assertProductionNoPasswordFallback(angebotAccess, "function getSecret")
assertNonProductionPasswordFallback(angebotAccess, "function getSecret")

assert(
  /Production.*Pflicht.*WRISTLINK_SESSION_SECRET/s.test(envExample) ||
    /Production \(NODE_ENV=production\): Pflicht/.test(envExample),
  "env.konfigurator.example muss Production-Pflicht für WRISTLINK_SESSION_SECRET dokumentieren",
)
assert(
  /Production.*Pflicht.*LEAD_SESSION_SECRET/s.test(envExample) ||
    /Production: Pflicht – kein Fallback auf WRISTLINK_PASSWORD/.test(envExample),
  "env.konfigurator.example muss Production-Pflicht für LEAD_SESSION_SECRET dokumentieren",
)

console.log("OK – security remediation secrets (Fix 6) contracts")
