"use server"

import { revalidatePath } from "next/cache"
import { getDb } from "@/lib/db"
import { getUser, requireRole } from "@/lib/auth"
import { toSafeErrorMessage } from "@/lib/safe-error"
import { asIsoString } from "@/lib/utils/date"
import {
  buildKpiDashboard,
  parsePeriod,
  toBerlinDate,
  type KpiCostEntry,
  type KpiDashboard,
  type KpiPeriod,
  type KpiQuote,
} from "@/lib/kpi/aggregate"
import {
  backfillInventorySnapshots,
  createInventorySnapshot,
  getBatchUnitCosts,
} from "@/lib/kpi/inventory-internal"
import type { QuoteStatus } from "@/lib/konfigurator/types"

const MAX_BETRAG = 10_000_000

function invalidBetrag(...values: Array<number | null | undefined>): boolean {
  return values.some((v) => v != null && (!Number.isFinite(v) || v < 0 || v > MAX_BETRAG))
}

const INVALID_BETRAG_ERROR = "Bitte gültige Beträge (≥ 0) eingeben"

const num = (value: unknown): number => (value == null ? 0 : Number(value) || 0)

export async function getKpiDashboardData(
  periodKey?: string,
): Promise<{ period: KpiPeriod; dashboard: KpiDashboard }> {
  await requireRole(["ADMIN"])
  const sql = getDb()
  const period = parsePeriod(periodKey, toBerlinDate(new Date()))

  const [quoteRows, baseRows, bestandRows, unitCosts] = await Promise.all([
    sql`
      SELECT
        id, status, source,
        config_json->>'modus' AS modus,
        COALESCE(NULLIF(config_json->>'menge', '')::numeric, 0)::int AS menge,
        NULLIF(config_json->>'von', '') AS von,
        COALESCE((price_snapshot_json->>'gesamt_netto')::numeric, 0) AS netto,
        druckkosten_netto,
        submitted_at, created_at, approved_at, accepted_at, paid_at,
        rejection_reason
      FROM quote_requests
      WHERE status != 'draft'
    `,
    sql`SELECT einkaufspreis_netto, created_at FROM bases WHERE einkaufspreis_netto IS NOT NULL`,
    sql`
      SELECT COALESCE(SUM(
        CASE b.booking_type
          WHEN 'ZUGANG' THEN bi.anzahl
          WHEN 'VERKAUF' THEN -bi.anzahl
          WHEN 'MIETE_RUECKGABE' THEN -COALESCE(bi.anzahl_fehlt, 0)
          ELSE 0
        END
      ), 0)::int AS bestand
      FROM booking_items bi
      JOIN bookings b ON b.id = bi.booking_id
      WHERE bi.group_id IS NOT NULL
        AND b.status IS DISTINCT FROM 'STORNIERT'
    `,
    getBatchUnitCosts(),
  ])

  const quotes: KpiQuote[] = quoteRows.map((row) => ({
    id: Number(row.id),
    status: row.status as QuoteStatus,
    source: String(row.source ?? "konfigurator"),
    modus: (row.modus as string | null) ?? null,
    menge: num(row.menge),
    von: (row.von as string | null) ?? null,
    netto: num(row.netto),
    druckkostenNetto: num(row.druckkosten_netto),
    submittedAt: asIsoString(row.submitted_at),
    createdAt: asIsoString(row.created_at) ?? new Date().toISOString(),
    approvedAt: asIsoString(row.approved_at),
    acceptedAt: asIsoString(row.accepted_at),
    paidAt: asIsoString(row.paid_at),
    rejectionReason: (row.rejection_reason as string | null) ?? null,
  }))

  const costs: KpiCostEntry[] = []
  for (const { row, zugangMenge } of unitCosts.values()) {
    const datumRaw = row.lieferdatum ?? row.created_at
    if (!datumRaw) continue
    const datum = toBerlinDate(new Date(datumRaw as string))
    const ek = row.einkaufspreis_stueck_netto
    if (ek != null) costs.push({ datum, kategorie: "einkauf", betrag: Number(ek) * zugangMenge })
    if (row.frachtkosten_netto != null) costs.push({ datum, kategorie: "fracht", betrag: Number(row.frachtkosten_netto) })
    if (row.zollkosten_netto != null) costs.push({ datum, kategorie: "zoll", betrag: Number(row.zollkosten_netto) })
  }
  for (const row of baseRows) {
    costs.push({
      datum: toBerlinDate(new Date(row.created_at as string)),
      kategorie: "basen",
      betrag: Number(row.einkaufspreis_netto),
    })
  }

  return {
    period,
    dashboard: buildKpiDashboard({
      period,
      quotes,
      costs,
      bestand: num(bestandRows[0]?.bestand),
    }),
  }
}

export type BatchCostRow = {
  id: number
  einkaufspreisStueck: number | null
  fracht: number | null
  zoll: number | null
  zugangMenge: number
  unitCost: number | null
}

export async function getBatchCosts(): Promise<BatchCostRow[]> {
  await requireRole(["ADMIN"])
  const unitCosts = await getBatchUnitCosts()
  return Array.from(unitCosts, ([id, { row, zugangMenge, unitCost }]) => ({
    id,
    einkaufspreisStueck: row.einkaufspreis_stueck_netto != null ? Number(row.einkaufspreis_stueck_netto) : null,
    fracht: row.frachtkosten_netto != null ? Number(row.frachtkosten_netto) : null,
    zoll: row.zollkosten_netto != null ? Number(row.zollkosten_netto) : null,
    zugangMenge,
    unitCost,
  }))
}

export async function updateBatchCosts(
  batchId: number,
  input: { einkaufspreisStueck: number | null; fracht: number | null; zoll: number | null },
) {
  try {
    await requireRole(["ADMIN"])
    if (invalidBetrag(input.einkaufspreisStueck, input.fracht, input.zoll)) {
      return { success: false, error: INVALID_BETRAG_ERROR }
    }
    const sql = getDb()
    const updated = await sql`
      UPDATE batches
      SET einkaufspreis_stueck_netto = ${input.einkaufspreisStueck},
          frachtkosten_netto = ${input.fracht},
          zollkosten_netto = ${input.zoll}
      WHERE id = ${batchId}
      RETURNING id
    `
    if (updated.length === 0) return { success: false, error: "Charge nicht gefunden" }
    revalidatePath("/admin")
    revalidatePath("/admin/kpi")
    return { success: true }
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error, "updateBatchCosts") }
  }
}

export async function updateBaseEinkaufspreis(baseId: number, preis: number | null) {
  try {
    await requireRole(["ADMIN"])
    if (invalidBetrag(preis)) return { success: false, error: INVALID_BETRAG_ERROR }
    const sql = getDb()
    await sql`UPDATE bases SET einkaufspreis_netto = ${preis} WHERE id = ${baseId}`
    revalidatePath("/admin")
    revalidatePath("/admin/kpi")
    return { success: true }
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error, "updateBaseEinkaufspreis") }
  }
}

export async function updateQuoteDruckkosten(quoteId: number, betrag: number | null) {
  try {
    await requireRole(["ADMIN"])
    if (invalidBetrag(betrag)) return { success: false, error: INVALID_BETRAG_ERROR }
    const sql = getDb()
    const updated = await sql`
      UPDATE quote_requests SET druckkosten_netto = ${betrag}, updated_at = NOW()
      WHERE id = ${quoteId}
      RETURNING id
    `
    if (updated.length === 0) return { success: false, error: "Auftrag nicht gefunden" }
    revalidatePath(`/warenverwaltung/auftraege/${quoteId}`)
    revalidatePath("/admin/kpi")
    return { success: true }
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error, "updateQuoteDruckkosten") }
  }
}

export type InventorySnapshotSummary = {
  id: number
  stichtag: string
  quelle: string
  mengeBaender: number
  mengeBasen: number
  gesamtWertNetto: number
  preiseUnvollstaendig: boolean
  createdAt: string
}

function mapSnapshot(row: Record<string, unknown>): InventorySnapshotSummary {
  return {
    id: Number(row.id),
    stichtag: String(row.stichtag),
    quelle: String(row.quelle),
    mengeBaender: Number(row.menge_baender),
    mengeBasen: Number(row.menge_basen),
    gesamtWertNetto: Number(row.gesamt_wert_netto),
    preiseUnvollstaendig: Boolean(row.preise_unvollstaendig),
    createdAt: asIsoString(row.created_at) ?? "",
  }
}

export async function listInventorySnapshots(): Promise<InventorySnapshotSummary[]> {
  await requireRole(["ADMIN"])
  const sql = getDb()
  const rows = await sql`
    SELECT id, to_char(stichtag, 'YYYY-MM-DD') AS stichtag, quelle, menge_baender, menge_basen,
           gesamt_wert_netto, preise_unvollstaendig, created_at
    FROM inventory_snapshots
    ORDER BY stichtag DESC
  `
  return rows.map(mapSnapshot)
}

export type InventorySnapshotItemRow = {
  itemTyp: "band" | "basis"
  groupName: string | null
  batchCode: string | null
  lieferant: string | null
  baseBezeichnung: string | null
  seriennummer: string | null
  menge: number
  stueckpreisNetto: number | null
  wertNetto: number
}

export async function getInventorySnapshot(
  id: number,
): Promise<{ snapshot: InventorySnapshotSummary; items: InventorySnapshotItemRow[] } | null> {
  await requireRole(["ADMIN"])
  const sql = getDb()
  const [head] = await sql`
    SELECT id, to_char(stichtag, 'YYYY-MM-DD') AS stichtag, quelle, menge_baender, menge_basen,
           gesamt_wert_netto, preise_unvollstaendig, created_at
    FROM inventory_snapshots WHERE id = ${id}
  `
  if (!head) return null
  const rows = await sql`
    SELECT item_typ, group_name, batch_code, lieferant, base_bezeichnung, seriennummer,
           menge, stueckpreis_netto, wert_netto
    FROM inventory_snapshot_items
    WHERE snapshot_id = ${id}
    ORDER BY item_typ DESC, group_name ASC NULLS LAST, batch_code ASC NULLS LAST, seriennummer ASC NULLS LAST
  `
  return {
    snapshot: mapSnapshot(head),
    items: rows.map((row) => ({
      itemTyp: row.item_typ as "band" | "basis",
      groupName: (row.group_name as string | null) ?? null,
      batchCode: (row.batch_code as string | null) ?? null,
      lieferant: (row.lieferant as string | null) ?? null,
      baseBezeichnung: (row.base_bezeichnung as string | null) ?? null,
      seriennummer: (row.seriennummer as string | null) ?? null,
      menge: Number(row.menge),
      stueckpreisNetto: row.stueckpreis_netto != null ? Number(row.stueckpreis_netto) : null,
      wertNetto: Number(row.wert_netto),
    })),
  }
}

export async function runInventoryBackfill() {
  try {
    await requireRole(["ADMIN"])
    const user = await getUser()
    const result = await backfillInventorySnapshots({ quelle: "manuell", userId: user ? Number(user.id) : null })
    revalidatePath("/admin/kpi")
    return { success: true, created: result.created }
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error, "runInventoryBackfill") }
  }
}

export async function recomputeInventorySnapshot(stichtag: string) {
  try {
    await requireRole(["ADMIN"])
    if (!/^\d{4}-\d{2}-01$/.test(stichtag)) {
      return { success: false, error: "Stichtag muss ein Monatserster sein" }
    }
    const user = await getUser()
    await createInventorySnapshot(stichtag, {
      quelle: "manuell",
      force: true,
      userId: user ? Number(user.id) : null,
    })
    revalidatePath("/admin/kpi")
    return { success: true }
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error, "recomputeInventorySnapshot") }
  }
}
