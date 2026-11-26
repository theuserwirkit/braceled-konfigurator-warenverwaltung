-- KPI-Dashboard: Einkaufskosten je Charge/Basis, Druckkosten je Auftrag, Inventur-Stichtage

ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS einkaufspreis_stueck_netto NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS frachtkosten_netto NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS zollkosten_netto NUMERIC(12,2);

ALTER TABLE bases
  ADD COLUMN IF NOT EXISTS einkaufspreis_netto NUMERIC(12,2);

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS druckkosten_netto NUMERIC(12,2);

-- Eingefrorener Lagerstand zum Stichtag (00:00 Uhr Europe/Berlin).
-- Namen/Codes werden kopiert, damit spätere Umbenennungen oder Löschungen die Inventur nicht verändern.
CREATE TABLE IF NOT EXISTS inventory_snapshots (
  id SERIAL PRIMARY KEY,
  stichtag DATE NOT NULL UNIQUE,
  quelle VARCHAR(20) NOT NULL,
  menge_baender INTEGER NOT NULL DEFAULT 0,
  menge_basen INTEGER NOT NULL DEFAULT 0,
  gesamt_wert_netto NUMERIC(14,2) NOT NULL DEFAULT 0,
  preise_unvollstaendig BOOLEAN NOT NULL DEFAULT false,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_snapshot_items (
  id SERIAL PRIMARY KEY,
  snapshot_id INTEGER NOT NULL REFERENCES inventory_snapshots(id) ON DELETE CASCADE,
  item_typ VARCHAR(10) NOT NULL,
  group_id INTEGER,
  group_name TEXT,
  batch_id INTEGER,
  batch_code TEXT,
  lieferant TEXT,
  base_id INTEGER,
  base_bezeichnung TEXT,
  seriennummer TEXT,
  menge INTEGER NOT NULL,
  stueckpreis_netto NUMERIC(12,4),
  wert_netto NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_inventory_snapshot_items_snapshot
  ON inventory_snapshot_items(snapshot_id);
