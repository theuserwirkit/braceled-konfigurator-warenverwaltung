#!/usr/bin/env npx tsx
/**
 * Prüft URL-Handling in allen typischen Kunden-Mail-Szenarien.
 */
import { readFileSync } from "fs"
import { join } from "path"
import { buildEmailBodies, normalizeBrokenUrls } from "../lib/konfigurator/email-html"
import { buildQuoteTemplateVars, renderTemplateText } from "../lib/konfigurator/email-template-render"
import type { QuoteRequest } from "../lib/konfigurator/types"

const STRIPE_URL = "https://checkout.stripe.com/c/pay/cs_test_abc123"

const sampleQuote = {
  id: 7,
  public_token: "ff466ac2-2483-4ba6-a130-437c20e36a7f",
  stripe_payment_link_url: STRIPE_URL,
  price_snapshot_json: { gesamt_netto: 3169, gesamt_brutto: 3771.11 },
  config_json: {
    kontaktName: "Max",
    menge: 500,
    von: "2026-07-20",
    bis: "2026-07-21",
    technikerAdresse: "Berlin, Messehalle 3",
    produkt: "armband",
    modus: "miete",
    druck: false,
    gruppen: 1,
    station: "eco",
    stationModus: "miete",
    lieferzeit: "regulaer",
    land: "DE",
  },
} as unknown as QuoteRequest

const TEMPLATE_KEYS_WITH_STATUS = [
  "quote_accepted_stripe",
  "quote_accepted_manual",
  "quote_paid",
  "fulfillment_vorbereitet",
  "fulfillment_bedruckt",
  "fulfillment_verpackt",
  "fulfillment_versand_beauftragt",
  "fulfillment_versandt",
  "fulfillment_ruecksendung_angekommen",
  "fulfillment_zurueckgepackt",
]

function loadAnnahmeTemplateBody(templateKey: string): string | null {
  const sql = readFileSync(join(__dirname, "migration", "30-quote-angebot-annahme.sql"), "utf8")
  const updateMarker = `WHERE template_key = '${templateKey}'`
  if (sql.includes(updateMarker)) {
    const chunk = sql.split(updateMarker)[0].split("UPDATE email_templates SET").pop() ?? ""
    const m = chunk.match(/body = '([\s\S]*)',\s+updated_at/)
    return m ? m[1].replace(/''/g, "'") : null
  }
  const insertMarker = `'${templateKey}',`
  if (sql.includes(insertMarker)) {
    const chunk = sql.split(insertMarker)[1]
    const m = chunk.match(/'(\{\{kunde_anrede\}\}[\s\S]*?)',\s+true\s*\)/)
    return m ? m[1].replace(/''/g, "'") : null
  }
  return null
}

function loadTemplateBody(templateKey: string): string {
  const annahme = loadAnnahmeTemplateBody(templateKey)
  if (annahme) return annahme
  const file = join(__dirname, "migration", "17-email-templates-angebot.sql")
  const sql = readFileSync(file, "utf8")
  const marker = `WHERE template_key = '${templateKey}'`
  if (sql.includes(marker)) {
    const chunk = sql.split(marker)[0]
    const bodyMatch = chunk.match(/body = '([\s\S]*)',\s+updated_at/s)
    if (bodyMatch) return bodyMatch[1].replace(/''/g, "'")
  }
  const fallback = join(__dirname, "migration", "15-email-templates-du.sql")
  const fallbackSql = readFileSync(fallback, "utf8")
  const parts = fallbackSql.split(marker)
  if (parts.length < 2) throw new Error(`Template ${templateKey} nicht gefunden`)
  const chunk = parts[0]
  const bodyMatch = chunk.match(/body = '([\s\S]*)',\s+updated_at/s)
  if (!bodyMatch) throw new Error(`Body für ${templateKey} nicht gefunden`)
  return bodyMatch[1].replace(/''/g, "'")
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

function checkBodies(label: string, text: string, statusUrl: string) {
  const broken = `Status:\n${statusUrl.split("/angebot")[0]}\n/angebot/${sampleQuote.public_token}`
  const normalized = normalizeBrokenUrls(broken)
  assert(normalized.includes(statusUrl), `${label}: normalizeBrokenUrls schlägt fehl`)

  const { text: plain, html } = buildEmailBodies(text)
  assert(
    plain.includes(`<${statusUrl}>`) || plain.includes(statusUrl),
    `${label}: Status-URL fehlt im Plain-Text`,
  )
  assert(html.includes(`href="${statusUrl}"`), `${label}: Status-URL fehlt im HTML-href`)
  assert(html.includes("Angebot und Status öffnen"), `${label}: HTML-Linktext für Status fehlt`)
  if (text.includes(STRIPE_URL)) {
    assert(html.includes("Jetzt online bezahlen"), `${label}: Stripe-Linktext fehlt`)
  }
}

let failed = 0
const vars = buildQuoteTemplateVars(sampleQuote, "kunde@example.com")

for (const key of TEMPLATE_KEYS_WITH_STATUS) {
  try {
    const body = renderTemplateText(loadTemplateBody(key), vars)
    checkBodies(key, body, vars.status_url)
    console.log(`OK  ${key}`)
  } catch (error) {
    failed++
    console.error(`FAIL ${key}:`, error instanceof Error ? error.message : error)
  }
}

try {
  const submitted = `Status und Angebot:\n${vars.status_url}`
  checkBodies("customer_submitted", submitted, vars.status_url)
  console.log("OK  customer_submitted")
} catch (error) {
  failed++
  console.error("FAIL customer_submitted:", error instanceof Error ? error.message : error)
}

for (const key of ["quote_approved_stripe", "quote_approved_manual"]) {
  try {
    const body = renderTemplateText(loadTemplateBody(key), { ...vars, gueltig_bis: "02.12.2026" })
    const { text: plain, html } = buildEmailBodies(body)
    assert(!/freigegeben/i.test(body), `${key}: enthält noch „freigegeben“`)
    assert(body.includes("unterbreiten"), `${key}: Angebots-Wording fehlt`)
    assert(body.includes("02.12.2026"), `${key}: Reservierungsdatum fehlt`)
    assert(!body.includes(STRIPE_URL), `${key}: Zahlungslink darf vor Annahme nicht enthalten sein`)
    assert(plain.includes(vars.annahme_url), `${key}: Annahme-Link fehlt im Plain-Text`)
    assert(html.includes("Angebot ansehen &amp; annehmen"), `${key}: Annahme-Button fehlt`)
    assert(html.includes("3.771,11"), `${key}: formatierter Betrag fehlt`)
    console.log(`OK  ${key}`)
  } catch (error) {
    failed++
    console.error(`FAIL ${key}:`, error instanceof Error ? error.message : error)
  }
}

try {
  const body = renderTemplateText(loadTemplateBody("quote_accepted_stripe"), vars)
  const { html } = buildEmailBodies(body)
  assert(html.includes(`href="${vars.bezahlen_url}"`), "Bezahl-Link fehlt")
  assert(html.includes("Jetzt online bezahlen"), "Bezahl-Button-Text fehlt")
  console.log("OK  quote_accepted_stripe Bezahl-Button")
} catch (error) {
  failed++
  console.error("FAIL quote_accepted_stripe Bezahl-Button:", error instanceof Error ? error.message : error)
}

if (failed > 0) {
  console.error(`\n${failed} Prüfung(en) fehlgeschlagen`)
  process.exit(1)
}

console.log("\nAlle E-Mail-URL-Prüfungen bestanden.")
