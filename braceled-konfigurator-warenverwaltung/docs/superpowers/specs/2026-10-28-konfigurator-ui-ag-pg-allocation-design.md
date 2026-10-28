# Konfigurator-UI-Fixes & AG↔PG-Zuordnung

**Datum:** 2026-10-28  
**Status:** Freigegeben — Spec, Implementation ausstehend  
**Terminologie:** **PG** = physikalische Lagergruppe; **AG** = Anfragegruppe (`gruppen` / `gruppenGroessen[]`)

## Problem

1. Konfigurator Schritt 2 startet mit Miete statt Kauf.
2. Probedruck mit Foto ist mit 149 EUR netto hinterlegt; Soll: 99 EUR.
3. Info-I an Basisstationen ist zu klein / wenig als Klickziel erkennbar.
4. Gruppen-Verfügbarkeit meldet fälschlich z. B. „7 AGs über 2 PGs möglich“ — fachlich unmöglich.
5. Angebotsstatus-Seite: Status oben zu dezent; 24-Stunden-Antwort-Hinweis fehlt.

## Ziel

Kleine UI-/Preis-Korrekturen plus korrekte AG↔PG-Allokation nach den hinterlegten Lagerregeln; Kunden-Hinweis „über X physische Lagergruppen“ bleibt, X wird korrekt berechnet.

## Festgelegte Entscheidungen

| Thema | Entscheidung |
|---|---|
| Default-Modus | `DEFAULT_CONFIG.modus = "kauf"`; Edit/`initialConfig` unverändert |
| Probedruck Fotos | `PROBEDRUCK_FOTOS_NETTO = 99` |
| Info-I | Größerer Icon-Button in `OptionCard` (Hit-Area / Kontrast); gleiche Modal-Logik |
| PG↔AG | **Exclusive:** eine PG höchstens einer AG |
| Max PGs | **Max. 3 PGs pro AG** (nicht über den ganzen Auftrag) |
| Kunden-Text | „möglich / nicht möglich (über X physische Lagergruppen)“ beibehalten |
| X | Anzahl **aller** genutzten PGs über **alle** AGs |
| Soft-Submit | Unverändert (rot, Absenden weiter möglich) |
| 24h-Hinweis | Nur bei Status `submitted` |
| Status-UI | Aktueller Status oben deutlich präsenter (großer Status-Block) |

## §1 AG↔PG-Zuordnung

### Regeln

1. Eine PG gehört höchstens **einer** AG (exclusive) — sonst würden Bänder derselben PG in mehreren AGs gleichzeitig leuchten / nur einmal ansteuerbar sein.
2. Pro AG: **1–3 PGs** (Mengensplit nur innerhalb dieser Grenze; sonst Lager- und Programmier-Chaos).
3. `physischeGruppen` (X) = Anzahl aller genutzten PGs über alle AGs hinweg.
4. Anzahl AGs kann nicht größer sein als die Anzahl dafür benötigter exclusive PGs (mindestens 1 PG pro AG).

### Algorithmus (Ansatz A — Greedy)

Datei: `lib/konfigurator/group-allocation.ts` → `allocateGroupProgramming`

1. AGs nach benötigter Menge **absteigend** sortieren.
2. Pro AG: aus noch **freien** PGs (größte `frei` zuerst) exklusiv zuteilen, bis Menge erreicht oder 3 PGs voll.
3. Reicht das nicht → AG in `fehlendeSlots` → `verfuegbar: false`.
4. Bei Erfolg: `physischeGruppen = |genutzte PG-IDs|`.

**Nicht mehr:** Auftragweit max. 3 PGs als Combo-Pool, aus dem alle AGs gierig denselben Bestand teilen.

### Regression-Beispiele

| Lager (PG frei) | Anfrage (AGs) | Ergebnis |
|---|---|---|
| G1:100, G2:200, G3:200, G4:200 | 2×250 | möglich, X=4 (z. B. AG1: G1+G2, AG2: G3+G4) |
| gleiches Lager | 450 + 50 | möglich, X=4 (große AG mit ≤3 PGs + kleine AG Rest) |
| gleiches Lager | 1×650 | **nicht** möglich (>3 PGs für eine AG) |
| beliebig, nur 2 PGs | 7 AGs | **nicht** möglich |

### UI & Docs

- Wizard-Text-Form beibehalten; X aus korrigierter Allokation.
- `docs/konfigurator.md`: Max-3 von „gesamt über Auftrag“ → **pro AG**; Exclusive PG↔AG dokumentieren.

### Folgeeffekte

Packzettel / Slot-Warehouse (`packing-sheet.ts`) nutzen `allocateGroupProgramming` mit — profitieren von derselben Korrektur; kein separates UI-Redesign in diesem Scope.

## §2 Konfigurator- & Status-UI

### Kauf vorausgewählt

- `components/konfigurator/configurator-wizard.tsx`: `DEFAULT_CONFIG.modus = "kauf"`.
- Gespeicherte Edit-Configs / `initialConfig` überschreiben weiter den Default.

### Probedruck mit Foto: 99 EUR netto

- `lib/pricing/constants.ts`: `PROBEDRUCK_FOTOS_NETTO = 99`.
- Preisengine / Labels lesen die Konstante bereits.

### Info-I Basisstationen

- `components/konfigurator/option-card.tsx`: Info-Control vergrößern (Icon ca. `h-5 w-5`, Hit-Area ca. `h-9 w-9`), klarer klickbar (Kontrast / leichter Border / Primary-Hover).
- `StationInfoModal`-Anbindung unverändert.

### Angebotsstatus-Seite

- `components/angebot/angebot-status-view.tsx`:
  - Status oben als präsenter Block (großes Label + Badge), nicht nur kleine Badge neben dem Kartentitel.
  - Bei `submitted`: Hinweis, dass die Konfiguration geprüft wird **und** in der Regel innerhalb von **24 Stunden** eine Antwort kommt.

## §3 Tests, Docs, Scope

### Tests

Neue Unit-Tests für `allocateGroupProgramming` (Regressionstabelle aus §1), inkl. Assertion: keine PG in zwei AGs.

### Docs

- Diese Spec.
- Korrektur `docs/konfigurator.md` (Gruppenprogrammierung / Max-3 / Exclusive).

### Außer Scope

- Soft-Submit-Policy ändern.
- Admin-Lager-UI neu gestalten.
- SevDesk-/Stripe-Sonderlogik außer dem Probedruck-Preis über die Konstante.
- Visual Companion / Mockups.

## Betroffene Dateien (erwartet)

| Datei | Änderung |
|---|---|
| `lib/konfigurator/group-allocation.ts` | Exclusive AG↔PG, max. 3 PGs **pro AG** |
| `scripts/test-*-group*` (neu) oder Erweiterung Tests | Regression AG/PG |
| `docs/konfigurator.md` | Regeltext korrigieren |
| `components/konfigurator/configurator-wizard.tsx` | Default `kauf` |
| `lib/pricing/constants.ts` | Probedruck Fotos 99 |
| `components/konfigurator/option-card.tsx` | Info-I größer |
| `components/angebot/angebot-status-view.tsx` | Status präsenter + 24h bei `submitted` |

## Erfolgskriterien

1. Neue Session: Schritt 2 zeigt Kauf vorausgewählt.
2. Probedruck „mit Foto“ = 99 EUR netto in UI/Preis.
3. Info-I an ECO/PRO optisch klar klickbar.
4. Beispiele aus §1 liefern die dokumentierten Verfügbarkeits-Ergebnisse; 7 AGs / 2 PGs nie „möglich“.
5. Kunden-Text zeigt korrektes X (Summe genutzter PGs).
6. Angebotsstatus: Status oben prominent; bei `submitted` 24h-Hinweis.
