import type { AvailabilityStressLevel } from "@/lib/konfigurator/availability-stress"
import { getAvailabilityForGroupBatchesByDateRange } from "@/lib/actions/bookings"
import {
  isWristlinkProdukt,
  resolveGroupsForProduct,
  type WristlinkProdukt,
} from "@/lib/product-mapping"
import {
  MAX_PHYSICAL_GROUPS,
  normalizeKanalanzahl,
} from "@/lib/konfigurator/kanalanzahl"

export type InventoryGroupPool = {
  groupId: number
  name: string
  kanalanzahl: number
  frei: number
}

export type GroupSlotAssignment = {
  slot: number
  benoetigt: number
  zuteilungen: Array<{ groupId: number; name: string; anzahl: number }>
}

export type GroupProgrammingAvailability = {
  verfuegbar: boolean
  slots: GroupSlotAssignment[]
  fehlendeSlots: number[]
  hinweis?: string
  inventory: InventoryGroupPool[]
  physischeGruppen: number
  maxPhysischeGruppen: number
}

function parseDate(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00`)
}

export async function getInventoryGroupPools(
  von: string,
  bis: string,
  kanalanzahl?: number,
  produkt: WristlinkProdukt = "armband",
): Promise<InventoryGroupPool[]> {
  const ch = kanalanzahl != null ? normalizeKanalanzahl(kanalanzahl) : 40
  const groups = await resolveGroupsForProduct(produkt, ch)
  const ausgabe = parseDate(von)
  const rueckgabe = parseDate(bis)
  const stats = await getAvailabilityForGroupBatchesByDateRange(
    groups.map((group) => group.id),
    ausgabe,
    rueckgabe,
  )
  const freiByGroup = new Map<number, number>()
  for (const row of stats) {
    freiByGroup.set(row.groupId, (freiByGroup.get(row.groupId) || 0) + row.verfuegbar)
  }
  const pools: InventoryGroupPool[] = []

  for (const group of groups) {
    const frei = freiByGroup.get(group.id) || 0
    if (frei <= 0) continue
    pools.push({
      groupId: group.id,
      name: group.name,
      kanalanzahl: group.kanalanzahl,
      frei,
    })
  }

  return pools.sort((a, b) => b.frei - a.frei)
}

function countDistinctGroups(slots: GroupSlotAssignment[]): number {
  const ids = new Set<number>()
  for (const slot of slots) {
    for (const z of slot.zuteilungen) ids.add(z.groupId)
  }
  return ids.size
}

/**
 * Ordnet pro Anfragegruppe (AG) Bänder aus physischen Lagergruppen (PG) zu.
 * Exklusiv: jede PG gehört höchstens einer AG.
 * Max. {@link MAX_PHYSICAL_GROUPS} physische Lagergruppen pro Anfragegruppe.
 */
export function allocateGroupProgramming(
  gruppenGroessen: number[],
  inventory: InventoryGroupPool[],
  maxPgsPerAg: number = MAX_PHYSICAL_GROUPS,
): GroupProgrammingAvailability {
  const empty: GroupProgrammingAvailability = {
    verfuegbar: false,
    slots: [],
    fehlendeSlots: gruppenGroessen.map((_, i) => i + 1),
    inventory,
    physischeGruppen: 0,
    maxPhysischeGruppen: maxPgsPerAg,
  }

  if (inventory.length === 0) {
    return { ...empty, hinweis: "Keine passenden Leuchtgruppen im Bestand." }
  }

  const remaining = inventory.map((g) => ({ ...g }))
  const slots: GroupSlotAssignment[] = gruppenGroessen.map((benoetigt, index) => ({
    slot: index + 1,
    benoetigt,
    zuteilungen: [],
  }))
  const fehlendeSlots: number[] = []

  const order = gruppenGroessen
    .map((benoetigt, index) => ({ benoetigt, index }))
    .sort((a, b) => b.benoetigt - a.benoetigt || a.index - b.index)

  for (const { index, benoetigt } of order) {
    if (benoetigt <= 0) continue

    let left = benoetigt
    const zuteilungen: GroupSlotAssignment["zuteilungen"] = []
    let pgsUsed = 0

    while (left > 0 && pgsUsed < maxPgsPerAg && remaining.length > 0) {
      remaining.sort((a, b) => b.frei - a.frei || a.groupId - b.groupId)
      const pool = remaining[0]
      if (pool.frei <= 0) {
        remaining.shift()
        continue
      }
      const take = Math.min(left, pool.frei)
      left -= take
      zuteilungen.push({ groupId: pool.groupId, name: pool.name, anzahl: take })
      remaining.shift()
      pgsUsed++
    }

    slots[index] = { slot: index + 1, benoetigt, zuteilungen }
    if (left > 0) fehlendeSlots.push(index + 1)
  }

  fehlendeSlots.sort((a, b) => a - b)
  const physischeGruppen = countDistinctGroups(slots)
  const verfuegbar = fehlendeSlots.length === 0

  if (verfuegbar) {
    return {
      verfuegbar: true,
      slots,
      fehlendeSlots: [],
      inventory,
      physischeGruppen,
      maxPhysischeGruppen: maxPgsPerAg,
    }
  }

  return {
    verfuegbar: false,
    slots,
    fehlendeSlots,
    inventory,
    physischeGruppen,
    maxPhysischeGruppen: maxPgsPerAg,
    hinweis: `Für Gruppe(n) ${fehlendeSlots.join(", ")} reicht der Bestand nicht aus (max. ${maxPgsPerAg} physische Lagergruppen pro Anfragegruppe, exklusiv).`,
  }
}

export async function checkGroupProgrammingAvailability(input: {
  von: string
  bis?: string
  gruppenGroessen: number[]
  kanalanzahl?: number
  produkt?: string
}): Promise<GroupProgrammingAvailability> {
  const bis = input.bis || input.von
  const sizes = input.gruppenGroessen
  const kanalanzahl = normalizeKanalanzahl(input.kanalanzahl)
  const produkt: WristlinkProdukt =
    input.produkt && isWristlinkProdukt(input.produkt) ? input.produkt : "armband"

  if (sizes.length === 0 || sizes.every((n) => n <= 0)) {
    return {
      verfuegbar: true,
      slots: [],
      fehlendeSlots: [],
      inventory: [],
      physischeGruppen: 0,
      maxPhysischeGruppen: MAX_PHYSICAL_GROUPS,
    }
  }

  const inventory = await getInventoryGroupPools(input.von, bis, kanalanzahl, produkt)
  return allocateGroupProgramming(sizes, inventory)
}

export function computeStationStress(input: {
  verfuegbar: boolean
  frei: number | null
  bestand: number | null
  belegt: number | null
}): { stressLevel: AvailabilityStressLevel; stressScore: number; stressLabel: string } {
  if (!input.verfuegbar) {
    return { stressLevel: "red", stressScore: 82, stressLabel: "Controller nicht verfügbar" }
  }
  const free = input.frei ?? 1
  const stock = input.bestand ?? free
  const occupancy = stock > 0 && input.belegt != null ? input.belegt / stock : 0
  if (free <= 1 || occupancy >= 0.75) {
    return { stressLevel: "yellow", stressScore: 52, stressLabel: "Controller knapp" }
  }
  return { stressLevel: "green", stressScore: 18, stressLabel: "Controller verfügbar" }
}
