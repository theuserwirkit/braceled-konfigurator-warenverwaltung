/**
 * Unit-Checks Textilband: Preise, Druckregeln, Gruppen-IDs/Anzeige, Lager-Kanal.
 * Run: npx tsx scripts/test-textilband.ts
 */
import { rechnePreis } from "../lib/pricing/preis-engine"
import {
  formatGroupDisplayLabel,
  formatTextilbandGruppeName,
  isTextilbandLeuchtgruppe,
  parseTextilbandGruppeName,
} from "../lib/konfigurator/leuchtgruppen"
import { resolveLagerKanalanzahl } from "../lib/konfigurator/kanalanzahl"
import { usesArmbandLager, textilbandDruckPreisNetto } from "../lib/konfigurator/product-info"

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL", msg)
    process.exitCode = 1
  } else {
    console.log("OK", msg)
  }
}

assert(usesArmbandLager("textilband"), "textilband uses LED soft-hold mechanics")
assert(resolveLagerKanalanzahl("textilband", 80) === 40, "textilband always 40 CH")
assert(resolveLagerKanalanzahl("armband", 80) === 80, "armband keeps 80")

assert(formatTextilbandGruppeName(1) === "T1_40ch", "T1 id")
assert(formatTextilbandGruppeName(10) === "T10_40ch", "T10 id")
assert(isTextilbandLeuchtgruppe("T3_40ch"), "parse T3")
assert(!isTextilbandLeuchtgruppe("G1_40ch"), "G1 is not textil")
assert(parseTextilbandGruppeName("T7_40ch")?.slot === 7, "slot 7")
assert(
  formatGroupDisplayLabel("T1_40ch") === "LED Textilarmband 40 CH Gruppe 1",
  "display label T1",
)
assert(
  formatGroupDisplayLabel("G2_80ch") === "LED Armband 80 CH Gruppe 2",
  "display label G2",
)

assert(textilbandDruckPreisNetto(250) === 0.7, "druck <=250")
assert(textilbandDruckPreisNetto(251) === 0.66, "druck >250")

const base = {
  produkt: "textilband",
  modus: "kauf",
  menge: 500,
  druck: false,
  gruppen: 0,
  station: "keine",
  stationModus: "miete",
  lieferpaket: "regulaer",
  land: "DE",
} as const

const p500 = rechnePreis(base)
assert(p500.gueltig, "kauf 500 gueltig")
if (p500.gueltig) {
  const prod = p500.positionen.find((x) =>
    x.pos.includes("Textilarmband") || x.pos.includes("Textilband"),
  )
  assert(prod?.einzel === 4.3, `kauf 500 stk 4.30 got ${prod?.einzel}`)
}

const p1000 = rechnePreis({ ...base, menge: 1000 })
assert(p1000.gueltig && p1000.gueltig && p1000.positionen[0].einzel === 4.1, "kauf 1000 → 4.10")

const p2000 = rechnePreis({ ...base, menge: 2000 })
assert(p2000.gueltig && p2000.positionen[0].einzel === 3.9, "kauf 2000 → 3.90")

const miete = rechnePreis({ ...base, modus: "miete", menge: 300 })
assert(miete.gueltig && miete.positionen[0].einzel === 3.9, "miete 3.90")

const mieteLedDruck = rechnePreis({ ...base, modus: "miete", druck: true })
assert(!mieteLedDruck.gueltig, "miete + LED-Druck ungültig")

const mieteTextil = rechnePreis({
  ...base,
  modus: "miete",
  druck: false,
  druckTextilband: true,
  menge: 300,
})
assert(mieteTextil.gueltig, "miete + Textilband-Druck ok")
if (mieteTextil.gueltig) {
  const tp = mieteTextil.positionen.find((x) => x.pos.includes("Textilband-Bedruckung"))
  assert(tp?.einzel === 0.66, `textil druck 300 → 0.66 got ${tp?.einzel}`)
}

const tooManyGroups = rechnePreis({
  ...base,
  station: "pro",
  stationModus: "miete",
  gruppen: 11,
})
assert(!tooManyGroups.gueltig, "max 10 gruppen")

if (process.exitCode) {
  console.error("Textilband-Tests fehlgeschlagen.")
  process.exit(1)
}
console.log("Alle Textilband-Tests bestanden.")
