# Konfigurator-UI-Fixes & AG↔PG-Zuordnung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kauf als Default, Probedruck-Fotos 99 €, größeres Info-I, korrekte exclusive AG↔PG-Allokation (max. 3 PGs pro AG), prominenter Angebotsstatus inkl. 24h-Hinweis bei `submitted`.

**Architecture:** Pure Allokationslogik in `group-allocation.ts` umbauen (Greedy: AGs nach Größe, PGs exclusive, max. 3 PGs/AG). UI-/Preis-Änderungen sind gezielte Einzeiler bzw. kleine Markup-Anpassungen. Docs und Wizard-Hilfstext an die PG/AG-Regeln anpassen. Tests als `tsx`-Script nach Projektkonvention.

**Tech Stack:** TypeScript, React/Next.js, `tsx` Script-Tests, bestehende `OptionCard` / `AngebotStatusView`.

**Spec:** `docs/superpowers/specs/2026-10-28-konfigurator-ui-ag-pg-allocation-design.md`

**Terminologie:** **PG** = physikalische Lagergruppe (`groupId`); **AG** = Anfragegruppe (Slot in `gruppenGroessen[]`).

---

## File map

| File | Responsibility |
|---|---|
| `lib/konfigurator/group-allocation.ts` | Exclusive AG↔PG, max. 3 PGs **pro AG**, X = Summe genutzter PGs |
| `lib/konfigurator/kanalanzahl.ts` | `MAX_PHYSICAL_GROUPS = 3` bleibt; Kommentar = max. PGs **pro AG** |
| `scripts/test-group-allocation.ts` | Regressionstests Spec §1 |
| `package.json` | Script `test:group-allocation` |
| `docs/konfigurator.md` | Regeltext Max-3 / Exclusive korrigieren; Probedruck 99 |
| `components/konfigurator/configurator-wizard.tsx` | Default `kauf`; Hilfstext „pro Gruppe“ statt „gesamt“ |
| `lib/pricing/constants.ts` | `PROBEDRUCK_FOTOS_NETTO = 99` |
| `components/konfigurator/option-card.tsx` | Info-I größer / klarer klickbar |
| `components/angebot/angebot-status-view.tsx` | Status prominent + 24h bei `submitted` |

---

### Task 1: Failing Tests für AG↔PG-Allokation (TDD)

**Files:**
- Create: `scripts/test-group-allocation.ts`
- Modify: `package.json` (test script)

- [ ] **Step 1: Write failing test script**

```typescript
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
```

- [ ] **Step 2: Add npm script**

In `package.json` scripts:

```json
"test:group-allocation": "tsx scripts/test-group-allocation.ts",
```

- [ ] **Step 3: Run test — expect FAIL** (altes Sharing-Verhalten bzw. Max-3 gesamt)

Run: `npm run test:group-allocation`

Expected: mindestens `FAIL 2×250 X=4` und/oder `FAIL 7 AGs / 2 PGs nicht verfügbar` (aktueller Code kann 7 AGs aus 2 PGs als verfügbar melden).

- [ ] **Step 4: Commit**

```bash
git add scripts/test-group-allocation.ts package.json
git commit -m "$(cat <<'EOF'
test: failing AG↔PG allocation regression coverage

EOF
)"
```

---

### Task 2: Implement exclusive AG↔PG allocation

**Files:**
- Modify: `lib/konfigurator/group-allocation.ts`
- Modify: `lib/konfigurator/kanalanzahl.ts` (Kommentar)

- [ ] **Step 1: Replace allocation helpers**

In `lib/konfigurator/group-allocation.ts`:

1. Remove `combinations`, `buildGroupCombos`, and the old shared `allocateFromPools` combo loop.
2. Keep types, `getInventoryGroupPools`, `countDistinctGroups`, `checkGroupProgrammingAvailability`, `computeStationStress`.
3. Implement exclusive greedy allocation:

```typescript
/**
 * Ordnet pro AG (Anfragegruppe/Slot) exclusive PGs zu.
 * - Eine PG gehört höchstens einer AG.
 * - Pro AG höchstens {@link MAX_PHYSICAL_GROUPS} PGs.
 * - Sobald eine PG einer AG zugeteilt wird, ist sie für andere AGs verbraucht
 *   (auch Restmenge derselben PG).
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
    .filter((row) => row.benoetigt > 0)
    .sort((a, b) => b.benoetigt - a.benoetigt || a.index - b.index)

  for (const { index, benoetigt } of order) {
    let left = benoetigt
    const zuteilungen: GroupSlotAssignment["zuteilungen"] = []
    const sorted = [...remaining]
      .filter((p) => p.frei > 0)
      .sort((a, b) => b.frei - a.frei || a.groupId - b.groupId)

    for (const pool of sorted) {
      if (left <= 0) break
      if (zuteilungen.length >= maxPgsPerAg) break

      const take = Math.min(left, pool.frei)
      if (take <= 0) continue

      const inv = inventory.find((g) => g.groupId === pool.groupId)!
      zuteilungen.push({ groupId: pool.groupId, name: inv.name, anzahl: take })
      left -= take

      const remIdx = remaining.findIndex((p) => p.groupId === pool.groupId)
      if (remIdx >= 0) remaining.splice(remIdx, 1)
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
    hinweis:
      fehlendeSlots.length > 0
        ? `Für Gruppe(n) ${fehlendeSlots.join(", ")} reicht der Bestand nicht aus (max. ${maxPgsPerAg} physische Lagergruppen pro Anfragegruppe, exclusive Zuordnung).`
        : `Mit höchstens ${maxPgsPerAg} physischen Lagergruppen pro Anfragegruppe ist keine vollständige Zuordnung möglich.`,
  }
}
```

4. Update JSDoc / comments: Max = **pro AG**, nicht über den Auftrag.

- [ ] **Step 2: Update constant comment**

In `lib/konfigurator/kanalanzahl.ts`:

```typescript
/** Max. physikalische Lagergruppen (PGs) pro Anfragegruppe (AG) */
export const MAX_PHYSICAL_GROUPS = 3
```

- [ ] **Step 3: Run tests — expect PASS**

Run: `npm run test:group-allocation`

Expected: `Alle Group-Allocation-Tests bestanden.` Exit 0.

- [ ] **Step 4: Commit**

```bash
git add lib/konfigurator/group-allocation.ts lib/konfigurator/kanalanzahl.ts
git commit -m "$(cat <<'EOF'
fix: exclusive AG↔PG allocation with max 3 PGs per AG

EOF
)"
```

---

### Task 3: Docs + Wizard-Hilfstext (PG/AG)

**Files:**
- Modify: `docs/konfigurator.md`
- Modify: `components/konfigurator/configurator-wizard.tsx` (Hilfstext bei Gruppen)

- [ ] **Step 1: Fix docs rules**

In `docs/konfigurator.md`:

1. Probedruck-Fotos-Zeile: `149` → `99`.
2. Abschnitt „Flexible Lager-Zuordnung“ / Max-3 ersetzen durch:

```markdown
#### Lager-Zuordnung (AG ↔ PG)

**AG** = Anfragegruppe (Kunden-Slot). **PG** = physikalische Lagergruppe (`group_id` / z. B. `G1_40ch`).

- Eine PG gehört höchstens **einer** AG (exclusive) — eine PG ist nur einmal ansteuerbar.
- Pro AG höchstens **3 PGs** (`MAX_PHYSICAL_GROUPS`) für den Mengensplit.
- Slot-Nummer muss nicht der G-Nummer entsprechen (AG1 darf z. B. aus G7+G12 kommen).
- `physischeGruppen` (Kunden-Hinweis „über X …“) = Anzahl **aller** genutzten PGs über alle AGs.

**Logik:** `lib/konfigurator/group-allocation.ts` → `allocateGroupProgramming()` (Greedy: AGs nach Größe absteigend, größte freie PGs zuerst).
```

3. Kundenregeln Punkt 6:

```markdown
6. Intern: max. 3 PGs **pro AG**, PG↔AG exclusive
```

4. Checklist / Erwähnungen „Max. 3 physische Lagergruppen gesamt“ → „pro AG“.

- [ ] **Step 2: Wizard helper text**

In `components/konfigurator/configurator-wizard.tsx` (Gruppen-Hinweis unter dem Count-Slider), Text von:

`max. {MAX_PHYSICAL_GROUPS} physische Lagergruppen gesamt`

auf:

`max. {MAX_PHYSICAL_GROUPS} physische Lagergruppen pro Gruppe`

Der bestehende Erfolgs-Text mit `(über ${groupAvailability.physischeGruppen} physische Lagergruppe…)` bleibt; X kommt aus der neuen Logik.

- [ ] **Step 3: Commit**

```bash
git add docs/konfigurator.md components/konfigurator/configurator-wizard.tsx
git commit -m "$(cat <<'EOF'
docs: correct AG↔PG rules and wizard helper copy

EOF
)"
```

---

### Task 4: Kauf-Default + Probedruck 99 €

**Files:**
- Modify: `components/konfigurator/configurator-wizard.tsx`
- Modify: `lib/pricing/constants.ts`

- [ ] **Step 1: Default modus kauf**

In `DEFAULT_CONFIG`:

```typescript
modus: "kauf",
```

Leave `stationModus` as-is unless product rules require sync on first paint; edit/`initialConfig` still overrides.

- [ ] **Step 2: Probedruck price**

In `lib/pricing/constants.ts`:

```typescript
export const PROBEDRUCK_FOTOS_NETTO = 99
```

- [ ] **Step 3: Sanity check preis-engine tests if any assert 149**

Run: `npm run test:preis-engine`

If a test hardcodes 149 for Fotos, update expectation to 99. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/konfigurator/configurator-wizard.tsx lib/pricing/constants.ts
# include any preis-engine test fix if needed
git commit -m "$(cat <<'EOF'
fix: default Kauf mode and Probedruck Fotos at 99 EUR

EOF
)"
```

---

### Task 5: Info-I an Basisstationen vergrößern

**Files:**
- Modify: `components/konfigurator/option-card.tsx`

- [ ] **Step 1: Larger clickable info control**

Replace the info `span` classes / icon size:

```tsx
className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground hover:border-foreground/30"
```

```tsx
<Info className="h-5 w-5" />
```

Keep `stopPropagation`, keyboard handlers, `aria-label` unchanged.

- [ ] **Step 2: Commit**

```bash
git add components/konfigurator/option-card.tsx
git commit -m "$(cat <<'EOF'
fix: make OptionCard info control easier to spot and tap

EOF
)"
```

---

### Task 6: Angebotsstatus prominenter + 24h-Hinweis

**Files:**
- Modify: `components/angebot/angebot-status-view.tsx`

- [ ] **Step 1: Prominent status block in header area**

Directly under the page header (before paid/cancelled alerts or as first main block), add a clear status panel; keep the existing Card content for actions, but move emphasis off the small header badge.

Example structure to implement:

```tsx
{/* Nach <header>, in <main> ganz oben */}
<section className="rounded-xl border bg-card p-6 shadow-sm">
  <p className="text-sm font-medium text-muted-foreground">Aktueller Status</p>
  <div className="mt-2 flex flex-wrap items-center gap-3">
    <p className="text-3xl font-semibold tracking-tight">{statusInfo.label}</p>
    <Badge variant={statusInfo.variant} className="text-sm px-3 py-1">
      {statusInfo.label}
    </Badge>
  </div>
  {quote.status === "submitted" && (
    <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
      <Clock className="h-4 w-4 mt-0.5 shrink-0" />
      <p>
        Wir prüfen Ihre Konfiguration. In der Regel melden wir uns innerhalb von 24 Stunden.
      </p>
    </div>
  )}
</section>
```

- [ ] **Step 2: Deduplicate submitted copy**

In the lower „Angebotsstatus“-Card: remove the old short submitted Clock-line (or reduce to actions only) so the 24h-Text nicht doppelt erscheint. Keep Badge in Card optional/smaller or remove redundant Badge if the hero block already shows status.

- [ ] **Step 3: Commit**

```bash
git add components/angebot/angebot-status-view.tsx
git commit -m "$(cat <<'EOF'
fix: make offer status prominent with 24h response note

EOF
)"
```

---

### Task 7: Verification

**Files:** none (run only)

- [ ] **Step 1: Run allocation + related tests**

```bash
npm run test:group-allocation
npm run test:gruppen-config
npm run test:preis-engine
```

Expected: all PASS / exit 0.

- [ ] **Step 2: Manual smoke (optional if app runnable)**

- `/konfigurator`: Schritt 2 Kauf vorausgewählt; Basisstation Info-I größer; Probedruck Fotos 99 €.
- PRO + Gruppen: 7 AGs mit knappen PGs → nicht „über 2 … möglich“.
- `/angebot/[token]` mit `submitted`: großer Status + 24h-Text.

- [ ] **Step 3: Final commit only if verification fixed stray files** — otherwise done.

---

## Spec coverage checklist

| Spec requirement | Task |
|---|---|
| Exclusive PG↔AG, max 3 PGs/AG, X=Summe | Task 1–2 |
| Regression 2×250, 450+50, 650, 7/2 | Task 1–2 |
| Docs Max-3 / Exclusive | Task 3 |
| Wizard Hilfstext | Task 3 |
| Default Kauf | Task 4 |
| Probedruck 99 | Task 4 |
| Info-I größer | Task 5 |
| Status prominent + 24h nur `submitted` | Task 6 |
| Soft-Submit unverändert | — (kein Task; nicht anfassen) |
