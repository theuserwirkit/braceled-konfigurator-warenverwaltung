import {
  allocateGroupProgramming,
  type InventoryGroupPool,
} from "../lib/konfigurator/group-allocation"

let failed = 0
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL", msg)
    failed++
  } else {
    console.log("OK", msg)
  }
}

function pool(id: number, name: string, frei: number): InventoryGroupPool {
  return { groupId: id, name, kanalanzahl: 40, frei }
}

function usedPgIds(result: ReturnType<typeof allocateGroupProgramming>): number[] {
  const ids = new Set<number>()
  for (const slot of result.slots) {
    for (const z of slot.zuteilungen) ids.add(z.groupId)
  }
  return [...ids].sort((a, b) => a - b)
}

function assertExclusive(result: ReturnType<typeof allocateGroupProgramming>, msg: string) {
  const seen = new Set<number>()
  for (const slot of result.slots) {
    for (const z of slot.zuteilungen) {
      assert(!seen.has(z.groupId), `${msg}: PG ${z.groupId} in mehreren AGs`)
      seen.add(z.groupId)
    }
  }
}

function assertMaxThreePgsPerAg(
  result: ReturnType<typeof allocateGroupProgramming>,
  msg: string,
) {
  for (const slot of result.slots) {
    assert(
      slot.zuteilungen.length <= 3,
      `${msg}: AG ${slot.slot} hat ${slot.zuteilungen.length} PGs`,
    )
  }
}

const lager = [
  pool(1, "G1_40ch", 100),
  pool(2, "G2_40ch", 200),
  pool(3, "G3_40ch", 200),
  pool(4, "G4_40ch", 200),
]

const twoTimes250 = allocateGroupProgramming([250, 250], lager)
assert(twoTimes250.verfuegbar === true, "2×250 verfügbar")
assert(twoTimes250.fehlendeSlots.length === 0, "2×250 keine fehlenden Slots")
assert(twoTimes250.physischeGruppen === 4, "2×250 X=4")
assertExclusive(twoTimes250, "2×250")
assertMaxThreePgsPerAg(twoTimes250, "2×250")
assert(
  twoTimes250.slots.every((s) => s.zuteilungen.reduce((n, z) => n + z.anzahl, 0) === 250),
  "2×250 Mengen je AG",
)

const bigAndSmall = allocateGroupProgramming([450, 50], lager)
assert(bigAndSmall.verfuegbar === true, "450+50 verfügbar")
assert(bigAndSmall.physischeGruppen === 4, "450+50 X=4")
assertExclusive(bigAndSmall, "450+50")
assertMaxThreePgsPerAg(bigAndSmall, "450+50")

const sixFifty = allocateGroupProgramming([650], lager)
assert(sixFifty.verfuegbar === false, "650 nicht verfügbar (>3 PGs/AG)")
assert(sixFifty.fehlendeSlots.includes(1), "650 Slot 1 fehlt")

const sevenAgsTwoPgs = allocateGroupProgramming(
  [50, 50, 50, 50, 50, 50, 50],
  [pool(1, "G1_40ch", 500), pool(2, "G2_40ch", 500)],
)
assert(sevenAgsTwoPgs.verfuegbar === false, "7 AGs / 2 PGs nicht verfügbar")
assert(sevenAgsTwoPgs.physischeGruppen <= 2, "7 AGs / 2 PGs nutzt höchstens 2 PGs")
assertExclusive(sevenAgsTwoPgs, "7 AGs / 2 PGs")

const empty = allocateGroupProgramming([100], [])
assert(empty.verfuegbar === false, "leeres Lager nicht verfügbar")

console.log(
  failed === 0
    ? "Alle Group-Allocation-Tests bestanden."
    : `${failed} fehlgeschlagen.`,
)
process.exit(failed > 0 ? 1 : 0)
