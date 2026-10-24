# Design: Kanonischer Miet-Write-Check (Gap #1)

**Datum:** 2026-10-24  
**Status:** Implementiert  
**Verwandt:** `2026-10-24-inventory-configurator-hardening-design.md` (Task 2 – Miet-Lock = Kalender)

## Problem

Ampel und Hold hatten historisch zwei Semantiken: Datumsfenster+Buffer vs. Punktbestand aller offenen Mieten. Das führt zu Hold-Fails trotz grüner Ampel bzw. inkonsistenten Admin-Buchungen.

## Ist-Stand (bereits geliefert im Hardening)

- `createBookingInternal`: `MIETE_AUSGABE` prüft unter Lock via `getAvailabilityForGroupBatchesByDateRange`
- `VERKAUF` bleibt Punktbestand
- Stornierte Buchungen (`STORNIERT`) zählen nicht in Overlaps
- Contract-Test: `pnpm test:miete-lock`

## Delta dieses Specs (nach Louez-Abgleich / Freigabe)

| Entscheidung | Inhalt |
|---|---|
| Owner-Helper | Reine Fenster-Auflösung + Write-Check-Pfad klar benannt (kein zweites Inline-Datum-Handling) |
| Ausgabedatum Pflicht (Option B) | `MIETE_AUSGABE` ohne `datumAusgabe` → Reject |
| Rückgabe-Fallback | Fehlt `datumRueckgabeGeplant` → `ausgabe + 3 Tage` (wie bestehende Miet-Overlap-Logik für offene Rentals) |
| Out of Scope | Controller-Holds (Gap #2), Admin Buffer-Override, Busy-Grund UI |

## Erfolgskriterien

1. Kein Inline-Sonderweg mehr für Miet-Fenster in `createBookingInternal` – nutzt Helper.
2. Fehlermeldung bei fehlendem Ausgabedatum klar (Ausgabedatum Pflicht).
3. Contract-/Unit-Tests decken Pflicht-Datum und +3-Tage-Fallback ab.
4. `pnpm test:miete-lock` grün.
