# Inventory + Konfigurator Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ampel, Hold, Freigabe und Lock-Checks teilen eine CH- und Miet-Verfügbarkeitssemantik; Soft-Cancel statt DELETE; echte Ops-Rollen.

**Architecture:** Ledger (`bookings`/`booking_items`) bleibt Single Source of Truth. Miet-Schreibpfad prüft unter Advisory-Lock kalenderbasiert (wie Ampel); Verkauf bleibt Punkt-Bestand. Holds werden `STORNIERT` statt gelöscht.

**Tech Stack:** Next.js 15, Neon Postgres, TypeScript, bestehende `tsx`-Testskripte, TDD.

**Worktree:** `.worktrees/inventory-configurator-next-level/braceled-konfigurator-warenverwaltung`  
**Branch:** `feature/inventory-configurator-next-level`  
**Spec:** `docs/superpowers/specs/2026-10-24-inventory-configurator-hardening-design.md`

**Hinweis Commits:** Feature-Branch-Commits nach jeder Task (User hat BMAD/Subagent-Workflow freigegeben).

---

### Task 1: `kanalanzahl` durch Hold + Freigabe

**Files:**
- Modify: `lib/actions/n8n-api.ts` (`N8nBookingRequest`, `findBestAllocation`, `createN8nBooking`)
- Modify: `lib/actions/quote-booking-internal.ts` (`createQuoteHoldBooking`, ggf. Finalize-Pfad)
- Modify: `lib/quotes-internal.ts` (`revalidateAvailability`)
- Test: `scripts/test-allocation-kanalanzahl.ts` (neue pure Assertions + Doku der Signaturen via Source-Scan)

- [ ] **Step 1: Write failing test script** that asserts source contains CH wiring (grep-style contract test):

```ts
// scripts/test-allocation-kanalanzahl.ts
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
function src(rel: string) {
  return readFileSync(join(root, rel), "utf8")
}
function assert(c: unknown, m: string) {
  if (!c) throw new Error(m)
}

const n8n = src("lib/actions/n8n-api.ts")
assert(/kanalanzahl\?:\s*number/.test(n8n), "N8nBookingRequest muss kanalanzahl haben")
assert(
  /resolveGroupsForProduct\(produkt,\s*kanalanzahl\)/.test(n8n),
  "findBestAllocation muss resolveGroupsForProduct mit kanalanzahl rufen",
)
assert(
  /findBestAllocation\([^)]*kanalanzahl/.test(n8n) ||
    /findBestAllocation\(produkt,\s*menge,\s*ausgabe,\s*rueckgabe,\s*kanalanzahl\)/.test(n8n),
  "findBestAllocation Signatur inkl. kanalanzahl",
)

const hold = src("lib/actions/quote-booking-internal.ts")
assert(
  /createN8nBooking\(\{[\s\S]*kanalanzahl/.test(hold),
  "createQuoteHoldBooking muss kanalanzahl an createN8nBooking übergeben",
)

const quotes = src("lib/quotes-internal.ts")
assert(
  /checkProductAvailability\(\{[\s\S]*kanalanzahl/.test(quotes),
  "revalidateAvailability muss kanalanzahl übergeben",
)

console.log("OK – kanalanzahl wiring contracts")
```

- [ ] **Step 2: Run** `pnpm exec tsx scripts/test-allocation-kanalanzahl.ts` → expect FAIL
- [ ] **Step 3: Implement**

In `n8n-api.ts`:
- Add `kanalanzahl?: number` to `N8nBookingRequest`
- `findBestAllocation(produkt, menge, ausgabe, rueckgabe, kanalanzahl?)` → `resolveGroupsForProduct(produkt, kanalanzahl)`
- In `createN8nBooking`: `const kanalanzahl = produkt === "armband" ? normalizeKanalanzahl(input.kanalanzahl) : undefined` und an `findBestAllocation` + Fehlerpfad `checkProductAvailability` durchreichen; `customerId` an `createBookingInternal` durchreichen falls Feld existiert

In `quote-booking-internal.ts` `createQuoteHoldBooking` und Miet-Finalize-`createN8nBooking`-Calls:
```ts
kanalanzahl:
  config.produkt === "armband"
    ? normalizeKanalanzahl(config.kanalanzahl)
    : undefined,
```

In `revalidateAvailability`:
```ts
kanalanzahl:
  config.produkt === "armband"
    ? normalizeKanalanzahl(config.kanalanzahl)
    : undefined,
```
(Import `normalizeKanalanzahl`.)

- [ ] **Step 4: Run test → PASS; `npx tsc --noEmit`**
- [ ] **Step 5: Commit** `fix: pass kanalanzahl through hold allocation and approve revalidation`

---

### Task 2: Miet-Lock-Check = Kalender-Semantik

**Files:**
- Modify: `lib/actions/bookings-internal.ts`
- Modify: `lib/actions/bookings.ts` (kleiner Helper exportieren oder bestehende Range-API nutzen)
- Extend: `scripts/test-allocation-kanalanzahl.ts` oder neues `scripts/test-miete-lock-availability.ts` (Source-Contract: MIETE_AUSGABE ruft Date-Range, nicht nur Point)

- [ ] **Step 1: Failing contract test** – `bookings-internal.ts` für `MIETE_AUSGABE` muss `getAvailabilityForGroupBatchesByDateRange` (oder neuen Helper) referenzieren; Point-Check nur noch für `VERKAUF`.
- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implement**

In `createBookingInternal` unter Lock:
```ts
if (input.bookingType === "VERKAUF") {
  // bestehend: getAvailabilityForGroupInternal
}
if (input.bookingType === "MIETE_AUSGABE") {
  const ausgabe = input.datumAusgabe
  const rueckgabe = input.datumRueckgabeGeplant || input.datumAusgabe
  if (!ausgabe || !rueckgabe) {
    return { success: false, error: "Mietbuchung braucht Ausgabe- und Rückgabedatum" }
  }
  for (const item of input.items) {
    const batchId = item.batchId || input.batchId
    if (!batchId) {
      return { success: false, error: "Mietbuchung braucht Charge (batchId)" }
    }
    const stats = await getAvailabilityForGroupBatchesByDateRange(
      [item.groupId],
      ausgabe,
      rueckgabe,
    )
    const row = stats.find((s) => s.groupId === item.groupId && s.batchId === batchId)
    const verfuegbar = row?.verfuegbar ?? 0
    if (verfuegbar < item.anzahl) { /* gleiche Fehlerstruktur wie bisher */ }
  }
}
```

Kommentar in `bookings-internal.ts` aktualisieren: fachliche Regel für Miete = Kalender+Puffer; Lots.menge nicht als Check.

- [ ] **Step 4: tsc + contract test PASS**
- [ ] **Step 5: Commit** `fix: use calendar availability under lock for rental bookings`

---

### Task 3: Soft-Cancel `STORNIERT`

**Files:**
- Modify: `lib/types.ts` (`BookingStatus`)
- Modify: `lib/actions/quote-booking-internal.ts` (`releaseQuoteBooking`)
- Modify: `lib/actions/bookings.ts` – Miet-Overlap-Queries und ggf. Point-`inVermietung` so dass `STORNIERT` nicht blockiert
- Modify: `lib/api-schemas.ts` Status-Enum falls nötig
- Test: Source/Unit-Contract dass `releaseQuoteBooking` `UPDATE`/`STORNIERT` nutzt, nicht `DELETE FROM bookings`

- [ ] **Step 1: Failing test** für Soft-Cancel-Contract + dass Date-Range-Rental-SQL `status` filtert bzw. Code `STORNIERT` ausschließt
- [ ] **Step 2: FAIL**
- [ ] **Step 3: Implement**

```ts
export type BookingStatus = "ANFRAGE" | "BESTAETIGT" | "STORNIERT"

export async function releaseQuoteBooking(bookingId: number | null | undefined): Promise<void> {
  if (!bookingId) return
  const sql = getDb()
  await sql`
    UPDATE bookings
    SET status = 'STORNIERT', bemerkung = COALESCE(bemerkung,'') || ' [storniert]'
    WHERE id = ${bookingId} AND status <> 'STORNIERT'
  `
  revalidateBookingPaths()
}
```

In `getAvailabilityForGroupBatchesByDateRange` Rentals-Query:
`AND b.status IS DISTINCT FROM 'STORNIERT'` (oder `IN ('ANFRAGE','BESTAETIGT')`).

In `getAvailabilityForGroupInternal`: `MIETE_AUSGABE`-Zeilen nur zählen wenn Booking nicht `STORNIERT` (JOIN + Filter). ZUGANG/VERKAUF unverändert (sollten nie storniert werden; falls doch, konservativ mitzählen nur wenn nicht STORNIERT).

- [ ] **Step 4: PASS + tsc**
- [ ] **Step 5: Commit** `fix: soft-cancel quote holds as STORNIERT instead of delete`

---

### Task 4: Submit CH erzwingen + Ops-Rollen

**Files:**
- Modify: `app/api/konfigurator/submit/route.ts`
- Modify: `app/api/konfigurator/update/[token]/route.ts` (bei Neuberechnung: Locked-Felder bleiben; für Erst-Submit immer resolve)
- Modify: `app/warenverwaltung/page.tsx`, `buchungen/page.tsx`, `auftraege/page.tsx`, `auftraege/[id]/page.tsx`, `app/kalender/page.tsx`
- Modify: Auth-Imports aus `lib/auth.ts` (`getUser`, `canEdit`, `canAdmin`)

- [ ] **Step 1: Contract tests** – submit route enthält nicht mehr `kanalanzahlSchonGesetzt` Trust-Pfad für Client; warenverwaltung pages rufen `canEdit`/`canAdmin` auf
- [ ] **Step 2: FAIL**
- [ ] **Step 3: Implement**

Submit:
```ts
const kanalanzahl =
  rawConfig.produkt === "armband"
    ? await resolveKanalanzahlForConfig(rawConfig)
    : undefined
```

Update-Route: Locked `kanalanzahl` aus bestehendem Quote behalten (bereits via merge); wenn merge Locked nutzt, Client-Overwrite weiter verwerfen — prüfen dass das so bleibt.

Warenverwaltung pages:
```ts
const user = await getUser()
const userCanEdit = await canEdit(user)
const userCanAdmin = await canAdmin(user)
```

- [ ] **Step 4: PASS + tsc**
- [ ] **Step 5: Commit** `fix: server-resolve kanalanzahl on submit; wire ops role flags`

---

### Task 5: Doku + package script + Verifikation

**Files:**
- Modify: `docs/konfigurator.md` (kurz: CH im Hold, Soft-Cancel, Ledger-SoT)
- Modify: `docs/audit-findings.md` oder neuer Eintrag in Spec „Implemented“
- Modify: `package.json` → `"test:allocation-kanalanzahl": "tsx scripts/test-allocation-kanalanzahl.ts"` (+ ggf. weitere)
- Run: alle `pnpm test:*`, `npx tsc --noEmit`

- [ ] **Step 1–4:** Docs + scripts + full verification
- [ ] **Step 5: Commit** `docs: inventory/configurator hardening notes and test scripts`

---

## Self-Review

1. Spec coverage: CH, Kalender-Lock, Soft-Cancel, Submit, Rollen, Ledger-Doku → Tasks 1–5  
2. No placeholders  
3. Types: `BookingStatus` inkl. `STORNIERT` konsistent
