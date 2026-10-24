# Design: Inventory + Konfigurator Hardening

**Datum:** 2026-10-24  
**BMAD:** Business → Architektur → Dev-Tasks (dieser Spec) → QA via TDD/Review

## Business (Warum)

Falsche Chargen-Zuordnung (40 vs 80 CH) und inkonsistente Verfügbarkeitschecks erzeugen Überbuchungsrisiko bzw. falsche Ablehnungen trotz Advisory-Locks. Soft-DELETE von Holds zerstört Audit-Trail. Ops-UI ignoriert Rollen.

## Ziele (In Scope)

1. **Eine CH-Wahrheit:** Ampel, Hold, Freigabe und Verkauf nutzen dieselbe `kanalanzahl`.
2. **Eine Miet-Verfügbarkeitssemantik:** Unter Lock dieselbe Kalender+Puffer-Logik wie die Ampel.
3. **Ledger als SoT (C-15):** `booking_items`/`bookings` entscheiden Verfügbarkeit; `inventory_lots.menge` bleibt abgeleiteter Cache (dokumentiert, nicht als Check-Quelle).
4. **Soft-Cancel:** Hold-Freigabe setzt `STORNIERT` statt DELETE; Verfügbarkeit ignoriert stornierte Buchungen.
5. **Submit-Sicherheit:** `kanalanzahl` immer serverseitig neu auflösen (Client-Wert nicht vertrauen).
6. **Rollen:** `/warenverwaltung` nutzt echte `canEdit`/`canAdmin`.

## Out of Scope (später)

- Wizard-Split (~1800 LOC)
- sevDesk-Auto-PDF
- Wizard-Draft-Persistenz
- Umbenennung `n8n-api.ts` (nur wenn Nebenprodukt nötig)

## Architektur-Entscheidungen

| Thema | Entscheidung |
|--------|----------------|
| Miet-Check unter Lock | `getAvailabilityForGroupBatchesByDateRange` (bzw. Single-Pair-Helper) mit `datumAusgabe`/`datumRueckgabeGeplant` aus dem Booking-Input |
| Verkauf-Check unter Lock | weiter Punkt-Bestand (`getAvailabilityForGroupInternal`) – physischer Abgang |
| Storno | `BookingStatus` += `STORNIERT`; UPDATE statt DELETE; alle Block/Stock-Queries filtern `status <> 'STORNIERT'` wo Miet-Overlaps zählen; ZUGANG/VERKAUF-Historie bleibt (Storno nur für Miet-Holds typisch) |
| CH-Propagation | `N8nBookingRequest.kanalanzahl`; `findBestAllocation(..., kanalanzahl)`; `createQuoteHoldBooking` reicht Config durch; `revalidateAvailability` ebenfalls |
| Submit | immer `resolveKanalanzahlForConfig` für Armband; Client-40/80 wird ignoriert |

## Datenfluss (Ziel)

```
Wizard Ampel → checkProductAvailability(+CH)
     ↓ Soft-Submit
createQuoteHoldBooking(+CH) → createN8nBooking(+CH) → findBestAllocation(+CH)
     ↓ unter Lock
createBookingInternal: MIETE → Kalender-Check; VERKAUF → Punkt-Check
     ↓ Admin
revalidateAvailability(+CH) → approve
```

## Fehlerfälle

- Keine Gruppe mit passender CH → klare Fehlermeldung inkl. CH
- Kalender frei, aber Punkt eng → nach Fix: Kalender entscheidet bei Miete
- Edit/Release: alte Buchung STORNIERT, neue Hold; Quote.booking_id zeigt auf neue

## Tests

- Unit: pure Helpers wo extrahierbar; Script-Tests für CH-Durchreichung / Status-Filter-Logik
- Typecheck + bestehende `pnpm test:*`
- Kein Live-DB-Zwang für Unit-Pfade

---

## Implemented (2026-10-24)

Branch: `feature/inventory-configurator-next-level`

| Task | Commit | Inhalt |
|------|--------|--------|
| 1 – kanalanzahl Hold/Freigabe | `3cb132e` | CH durch Ampel → Hold → Allocation → Approve-Revalidation |
| 2 – Miet-Lock = Kalender | `656ac8e` | MIETE unter Lock: Date-Range+Puffer; VERKAUF: Punkt-Bestand |
| 3 – Soft-Cancel STORNIERT | `a755985` | Hold-Freigabe UPDATE statt DELETE |
| 3b – STORNIERT in Stats | `f4c6da0` | Belegungs-/Dashboard-Queries filtern `STORNIERT` |
| 4 – Submit + Ops-Rollen | `87a685a` | Server-resolve `kanalanzahl`; `/warenverwaltung` `canEdit`/`canAdmin` |
| 5 – Doku + Scripts + Verify | (dieser Commit) | `docs/konfigurator.md`, Spec, C-15-Entscheidung; `test:miete-lock` u. a. |

**C-15:** Entscheidung festgehalten — Ledger SoT, `inventory_lots.menge` = abgeleiteter Cache (siehe `docs/audit-findings.md`).
