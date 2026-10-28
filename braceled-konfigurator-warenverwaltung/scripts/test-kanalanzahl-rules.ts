import {
  getKanalanzahlOptions,
  getMandatoryKanalanzahl,
  GRUPPEN_80CH_MIN,
} from "../lib/konfigurator/leuchtgruppen"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

let failed = 0
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL", msg)
    failed++
  } else {
    console.log("OK", msg)
  }
}

assert(GRUPPEN_80CH_MIN === 11, "80 CH Pflicht ab 11 Gruppen")
assert(getMandatoryKanalanzahl(10) === null, "10 Gruppen: keine Pflicht-CH")
assert(getMandatoryKanalanzahl(11) === 80, "11 Gruppen: Pflicht 80")
assert(getMandatoryKanalanzahl(20) === 80, "20 Gruppen: Pflicht 80")

assert(
  JSON.stringify(getKanalanzahlOptions(5)) === JSON.stringify([40, 80]),
  "≤10: Optionen 40 oder 80 (kein Mix in einer Allokation)",
)
assert(
  JSON.stringify(getKanalanzahlOptions(11)) === JSON.stringify([80]),
  "≥11: nur 80",
)

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const resolve = readFileSync(join(root, "lib/konfigurator/resolve-kanalanzahl.ts"), "utf8")
assert(
  /for \(const ch of \[40, 80\]/.test(resolve),
  "resolveKanalanzahl prüft 40 und 80 exklusiv nacheinander",
)
assert(
  /checkStationAvailability/.test(resolve) && /kanalanzahl/.test(resolve),
  "Controller-Verfügbarkeit läuft mit derselben kanalanzahl",
)

const station = readFileSync(join(root, "lib/konfigurator/station-availability.ts"), "utf8")
assert(
  /AND kanalanzahl = \$\{kanalanzahl\}/.test(station) ||
    /kanalanzahl = \$\{kanalanzahl\}/.test(station),
  "bases-Query filtert nach kanalanzahl",
)

const alloc = readFileSync(join(root, "lib/konfigurator/group-allocation.ts"), "utf8")
assert(
  /resolveGroupsForProduct\("armband", ch\)/.test(alloc) ||
    /resolveGroupsForProduct\("armband",/.test(alloc),
  "Gruppen-Pools nur für eine CH",
)

console.log(failed === 0 ? "Alle Kanalanzahl-Regel-Tests bestanden." : `${failed} fehlgeschlagen.`)
process.exit(failed > 0 ? 1 : 0)
