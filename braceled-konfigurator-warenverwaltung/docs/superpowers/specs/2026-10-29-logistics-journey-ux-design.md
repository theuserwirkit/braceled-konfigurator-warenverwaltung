# Produktion & Logistik – „Paket als Reise“

Datum: 2026-10-29  
Status: approved (Chat)

## Ziel

Schritt Extras: Lieferpaket-Auswahl und Zeitstrahl als **eine Komposition**. Gewähltes Paket färbt die Reise; Eil wirkt als 48h-Sprint; kein Overflow; Disabled-Pakete leise.

## UI

1. **Paket-Karten** – Badge (20 WT / 10 WT / 48 Std), ein Nutzen-Satz, Preis („kein Aufpreis“ bei 0 €). Disabled: nur „Zu wenig Vorlauf“.
2. **Reise-Strahl** – Phasen: Produktion → Versand → Ankunft → Event → Rückgabe. Event = Anker. Vergangene gedimmt, nächste aktiv. Eil: Produktion+Versand kompakt als Sprint.
3. **Flex-Rückgabe** – darunter, unveränderte Logik; Rückgabe-Segment reagiert über bestehende Timeline-Daten.
4. **Nicht-Ziele** – keine Preis-/Meilenstein-Logik-Änderung, keine Klick-Tooltips pro Phase.

## Technik

- `LIEFERPAKET_OPTIONS`: kurze `badge` / `shortDescription`
- `LogisticsTimeline` → Journey-Darstellung (bestehendes `buildLogisticsTimeline`)
- Wizard: Auswahl + Journey in einer Hülle
