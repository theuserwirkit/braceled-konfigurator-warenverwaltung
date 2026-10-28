-- Textilband-Lagergruppen T1_40ch … T10_40ch (eigene SKUs, getrennt von G*_ch).
-- Anzeige in der App: „Textilband 40 CH Gruppe N“
-- Nach dem Insert: ggf. syncSKUsAndLots im Admin ausführen bzw. unten SKUs anlegen.

INSERT INTO groups (name, kanalanzahl)
SELECT v.name, 40
FROM (
  VALUES
    ('T1_40ch'), ('T2_40ch'), ('T3_40ch'), ('T4_40ch'), ('T5_40ch'),
    ('T6_40ch'), ('T7_40ch'), ('T8_40ch'), ('T9_40ch'), ('T10_40ch')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM groups g WHERE g.name = v.name);

INSERT INTO skus (item_type, group_id)
SELECT 'LED_BAND', g.id
FROM groups g
WHERE g.name ~ '^T([1-9]|10)_40ch$'
  AND NOT EXISTS (
    SELECT 1 FROM skus s WHERE s.group_id = g.id AND s.item_type = 'LED_BAND'
  );

-- Bestand 0 für alle bestehenden Chargen (optional, analog syncSKUsAndLots)
INSERT INTO inventory_lots (sku_id, batch_id, menge)
SELECT s.id, b.id, 0
FROM skus s
JOIN groups g ON g.id = s.group_id
CROSS JOIN batches b
WHERE g.name ~ '^T([1-9]|10)_40ch$'
  AND s.item_type = 'LED_BAND'
  AND NOT EXISTS (
    SELECT 1 FROM inventory_lots il
    WHERE il.sku_id = s.id AND il.batch_id = b.id
  );
