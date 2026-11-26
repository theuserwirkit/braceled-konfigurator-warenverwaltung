import "server-only"

// Ohne "use server": wird sowohl von den Admin-Actions (mit Rollenprüfung) als auch
// vom Cron-Endpoint (CRON_SECRET) aufgerufen und darf keine Server-Action-Oberfläche bilden.

import { getDb, withInteractiveTransaction } from "@/lib/db"
import { batchUnitCost, inventoryStichtage, round2, toBerlinDate } from "@/lib/kpi/aggregate"

export type InventorySnapshotQuelle = "cron" | "rueckwirkend" | "manuell"

export type InventoryItem = {
  itemTyp: "band" | "basis"
  groupId: number | null
  groupName: string | null
  batchId: number | null
  batchCode: string | null
  lieferant: string | null
  baseId: number | null
  baseBezeichnung: string | null
  seriennummer: string | null
  menge: number
  stueckpreisNetto: number | null
  wertNetto: number
}

const num = (value: unknown): number | null =>
  value === null || value === undefined || value === "" ? null : Number(value)

/** Anschaffungskosten pro Stück je Charge (EK + anteilige Fracht/Zoll über alle Band-Zugänge). */
export async function getBatchUnitCosts(): Promise<
  Map<number, { unitCost: number | null; zugangMenge: number; row: Record<string, unknown> }>
> {
  const sql = getDb()
  const rows = await sql`
    SELECT
      ba.*,
      COALESCE((
        SELECT SUM(bi.anzahl)
        FROM booking_items bi
        JOIN bookings b ON b.id = bi.booking_id
        WHERE bi.batch_id = ba.id
          AND bi.group_id IS NOT NULL
          AND b.booking_type = 'ZUGANG'
          AND b.status IS DISTINCT FROM 'STORNIERT'
      ), 0)::int AS zugang_menge
    FROM batches ba
  `
  const map = new Map<number, { unitCost: number | null; zugangMenge: number; row: Record<string, unknown> }>()
  for (const row of rows) {
    const zugangMenge = Number(row.zugang_menge) || 0
    map.set(Number(row.id), {
      zugangMenge,
      row,
      unitCost: batchUnitCost({
        einkaufspreisStueck: num(row.einkaufspreis_stueck_netto),
        fracht: num(row.frachtkosten_netto),
        zoll: num(row.zollkosten_netto),
        zugangMenge,
      }),
    })
  }
  return map
}

/**
 * Bestand zum Stichtag 00:00 Uhr (Europe/Berlin) aus dem Buchungsjournal.
 * Vermietete Bänder bleiben Eigentum und zählen mit; Abgänge sind Verkäufe (ab Ausgabedatum)
 * und bei Rückgabe als fehlend/defekt gemeldete Bänder.
 */
export async function computeInventoryAt(stichtag: string): Promise<InventoryItem[]> {
  const sql = getDb()
  const [bandRows, baseRows, unitCosts] = await Promise.all([
    sql`
      SELECT
        bi.group_id,
        bi.batch_id,
        g.name AS group_name,
        ba.code AS batch_code,
        ba.lieferant,
        SUM(
          CASE b.booking_type
            WHEN 'ZUGANG' THEN bi.anzahl
            WHEN 'VERKAUF' THEN -bi.anzahl
            WHEN 'MIETE_RUECKGABE' THEN -COALESCE(bi.anzahl_fehlt, 0)
            ELSE 0
          END
        )::int AS menge
      FROM booking_items bi
      JOIN bookings b ON b.id = bi.booking_id
      LEFT JOIN groups g ON g.id = bi.group_id
      LEFT JOIN batches ba ON ba.id = bi.batch_id
      WHERE bi.group_id IS NOT NULL
        AND b.status IS DISTINCT FROM 'STORNIERT'
        AND (
          CASE b.booking_type
            WHEN 'VERKAUF' THEN COALESCE(b.datum_ausgabe, b.created_at)
            WHEN 'MIETE_RUECKGABE' THEN COALESCE(b.datum_rueckgabe_ist, b.created_at)
            ELSE b.created_at
          END
        ) < (${stichtag}::date::timestamp AT TIME ZONE 'Europe/Berlin')
      GROUP BY bi.group_id, bi.batch_id, g.name, ba.code, ba.lieferant
      HAVING SUM(
        CASE b.booking_type
          WHEN 'ZUGANG' THEN bi.anzahl
          WHEN 'VERKAUF' THEN -bi.anzahl
          WHEN 'MIETE_RUECKGABE' THEN -COALESCE(bi.anzahl_fehlt, 0)
          ELSE 0
        END
      ) <> 0
      ORDER BY g.name ASC NULLS LAST, ba.code ASC NULLS LAST
    `,
    sql`
      SELECT
        bs.id,
        bs.bezeichnung,
        bs.seriennummer,
        bs.einkaufspreis_netto,
        bs.batch_id,
        ba.code AS batch_code,
        ba.lieferant
      FROM bases bs
      LEFT JOIN batches ba ON ba.id = bs.batch_id
      WHERE bs.created_at < (${stichtag}::date::timestamp AT TIME ZONE 'Europe/Berlin')
        AND NOT EXISTS (
          SELECT 1
          FROM booking_items bi
          JOIN bookings b ON b.id = bi.booking_id
          WHERE bi.base_id = bs.id
            AND b.status IS DISTINCT FROM 'STORNIERT'
            AND (
              (b.booking_type = 'VERKAUF'
                AND COALESCE(b.datum_ausgabe, b.created_at) < (${stichtag}::date::timestamp AT TIME ZONE 'Europe/Berlin'))
              OR (b.booking_type = 'MIETE_RUECKGABE' AND COALESCE(bi.anzahl_fehlt, 0) > 0
                AND COALESCE(b.datum_rueckgabe_ist, b.created_at) < (${stichtag}::date::timestamp AT TIME ZONE 'Europe/Berlin'))
            )
        )
      ORDER BY bs.seriennummer ASC NULLS LAST, bs.bezeichnung ASC
    `,
    getBatchUnitCosts(),
  ])

  const items: InventoryItem[] = bandRows.map((row) => {
    const menge = Number(row.menge)
    const unitCost = row.batch_id ? unitCosts.get(Number(row.batch_id))?.unitCost ?? null : null
    return {
      itemTyp: "band",
      groupId: row.group_id != null ? Number(row.group_id) : null,
      groupName: (row.group_name as string | null) ?? null,
      batchId: row.batch_id != null ? Number(row.batch_id) : null,
      batchCode: (row.batch_code as string | null) ?? null,
      lieferant: (row.lieferant as string | null) ?? null,
      baseId: null,
      baseBezeichnung: null,
      seriennummer: null,
      menge,
      stueckpreisNetto: unitCost,
      wertNetto: unitCost != null ? round2(unitCost * menge) : 0,
    }
  })

  for (const row of baseRows) {
    const preis = num(row.einkaufspreis_netto)
    items.push({
      itemTyp: "basis",
      groupId: null,
      groupName: null,
      batchId: row.batch_id != null ? Number(row.batch_id) : null,
      batchCode: (row.batch_code as string | null) ?? null,
      lieferant: (row.lieferant as string | null) ?? null,
      baseId: Number(row.id),
      baseBezeichnung: (row.bezeichnung as string | null) ?? null,
      seriennummer: (row.seriennummer as string | null) ?? null,
      menge: 1,
      stueckpreisNetto: preis,
      wertNetto: preis != null ? round2(preis) : 0,
    })
  }

  return items
}

/**
 * Friert den Bestand zum Stichtag ein. Ohne `force` bleibt eine vorhandene Inventur unangetastet.
 * Gibt `null` zurück, wenn bereits eine Inventur existiert und nicht überschrieben wurde.
 */
export async function createInventorySnapshot(
  stichtag: string,
  options: { quelle: InventorySnapshotQuelle; force?: boolean; userId?: number | null },
): Promise<number | null> {
  const items = await computeInventoryAt(stichtag)
  const mengeBaender = items.filter((i) => i.itemTyp === "band").reduce((s, i) => s + i.menge, 0)
  const mengeBasen = items.filter((i) => i.itemTyp === "basis").reduce((s, i) => s + i.menge, 0)
  const gesamtWert = round2(items.reduce((s, i) => s + i.wertNetto, 0))
  const preiseUnvollstaendig = items.some((i) => i.stueckpreisNetto == null)

  return withInteractiveTransaction(async (query) => {
    if (options.force) {
      await query(`DELETE FROM inventory_snapshots WHERE stichtag = $1::date`, [stichtag])
    }
    const inserted = await query(
      `INSERT INTO inventory_snapshots
         (stichtag, quelle, menge_baender, menge_basen, gesamt_wert_netto, preise_unvollstaendig, created_by)
       VALUES ($1::date, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (stichtag) DO NOTHING
       RETURNING id`,
      [stichtag, options.quelle, mengeBaender, mengeBasen, gesamtWert, preiseUnvollstaendig, options.userId ?? null],
    )
    if (inserted.length === 0) return null
    const snapshotId = Number(inserted[0].id)

    for (const item of items) {
      await query(
        `INSERT INTO inventory_snapshot_items
           (snapshot_id, item_typ, group_id, group_name, batch_id, batch_code, lieferant,
            base_id, base_bezeichnung, seriennummer, menge, stueckpreis_netto, wert_netto)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          snapshotId,
          item.itemTyp,
          item.groupId,
          item.groupName,
          item.batchId,
          item.batchCode,
          item.lieferant,
          item.baseId,
          item.baseBezeichnung,
          item.seriennummer,
          item.menge,
          item.stueckpreisNetto,
          item.wertNetto,
        ],
      )
    }
    return snapshotId
  })
}

/** Legt alle fehlenden Monats-Inventuren seit der ersten Lagerbewegung an. */
export async function backfillInventorySnapshots(options: {
  quelle: InventorySnapshotQuelle
  userId?: number | null
}): Promise<{ created: string[] }> {
  const sql = getDb()
  const [first] = await sql`
    SELECT LEAST(
      (SELECT MIN(created_at) FROM bookings),
      (SELECT MIN(created_at) FROM bases)
    ) AS first_activity
  `
  if (!first?.first_activity) return { created: [] }

  const today = toBerlinDate(new Date())
  const currentStichtag = `${today.slice(0, 7)}-01`
  const stichtage = inventoryStichtage(toBerlinDate(new Date(first.first_activity)), today)
  const existing = await sql`SELECT to_char(stichtag, 'YYYY-MM-DD') AS stichtag FROM inventory_snapshots`
  const existingSet = new Set(existing.map((r) => String(r.stichtag)))

  const created: string[] = []
  for (const stichtag of stichtage) {
    if (existingSet.has(stichtag)) continue
    const id = await createInventorySnapshot(stichtag, {
      quelle: stichtag === currentStichtag ? options.quelle : "rueckwirkend",
      userId: options.userId,
    })
    if (id != null) created.push(stichtag)
  }
  return { created }
}
