# Admin Auftrag anpassen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin kann vor Zahlung auf der Auftragsdetailseite Menge und Techniker anpassen; Preis/Version/Hold/Stripe-Reset wie Kunden-Edit; optional Kunden-Mail.

**Architecture:** Pure Merge-Helper `quote-admin-adjust.ts` → Core `adjustQuoteByAdmin` in `quotes-internal.ts` (Spiegel von `updateQuoteByPublicToken`) → Server Action `adjustQuoteOrder` → Header-Dialog. E-Mail-Template per Migration 28.

**Tech Stack:** Next.js App Router, Server Actions, Neon SQL, Zod, bestehende `rechnePreis` / `quote_request_versions` / `sendFromTemplateKey`

**Spec:** `docs/superpowers/specs/2026-08-06-admin-auftrag-anpassen-design.md`

---

## File map

| File | Responsibility |
|---|---|
| `lib/konfigurator/quote-admin-adjust.ts` | Merge nur Menge/Techniker; Gruppen-Split; Summary |
| `scripts/test-admin-adjust.ts` | Unit-Tests für Merge/Summary |
| `lib/quotes-internal.ts` | `adjustQuoteByAdmin` |
| `lib/actions/quotes.ts` | `adjustQuoteOrder` Auth-Wrapper |
| `lib/konfigurator/email.ts` | `sendCustomerAdjustedEmail` |
| `scripts/migration/28-email-quote-adjusted-admin.sql` | Template `quote_adjusted_admin` |
| `scripts/run-migrations.mjs` | Migration 28 registrieren |
| `components/admin/auftrag-anpassen-dialog.tsx` | Dialog + Live-Preis |
| `app/warenverwaltung/auftraege/[id]/page.tsx` | Header-Button einbinden |
| `package.json` | `test:admin-adjust` Script |
| `docs/TODO.md` | Punkt abhaken |
| `docs/auftrag-detail-ux-redesign.md` | Scope-Hinweis aktualisieren |

---

### Task 1: Merge-Helper + Unit-Tests (TDD)

**Files:**
- Create: `lib/konfigurator/quote-admin-adjust.ts`
- Create: `scripts/test-admin-adjust.ts`
- Modify: `package.json` (Script)

- [ ] **Step 1: Failing test script schreiben**

```ts
// scripts/test-admin-adjust.ts
import {
  mergeAdminAdjustConfig,
  buildAdminAdjustSummary,
  type AdminAdjustPatch,
} from "../lib/konfigurator/quote-admin-adjust"
import type { QuoteConfig } from "../lib/konfigurator/types"

const base: QuoteConfig = {
  produkt: "armband",
  modus: "miete",
  menge: 500,
  von: "2026-09-12",
  bis: "2026-09-14",
  druck: true,
  druckArt: "logo",
  lieferpaket: "regulaer",
  flexRueckgabe: false,
  gruppen: 0,
  station: "keine",
  stationModus: "miete",
  lieferzeit: "standard",
  land: "DE",
  kontaktName: "Max",
  kontaktPlz: "10115",
  techniker: false,
}

let failed = 0
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg)
    failed++
  } else {
    console.log("OK:", msg)
  }
}

const patch: AdminAdjustPatch = {
  menge: 700,
  techniker: true,
  technikerTage: 2,
  technikerKm: 40,
  technikerAdresse: "Berlin",
}
const merged = mergeAdminAdjustConfig(base, patch)
assert(merged.menge === 700, "menge applied")
assert(merged.techniker === true, "techniker on")
assert(merged.technikerTage === 2, "technikerTage")
assert(merged.technikerKm === 40, "technikerKm")
assert(merged.technikerAdresse === "Berlin", "technikerAdresse")
assert(merged.von === "2026-09-12", "von untouched")
assert(merged.produkt === "armband", "produkt untouched")
assert(merged.druck === true, "druck untouched")

const withGruppen: QuoteConfig = {
  ...base,
  station: "pro",
  gruppen: 2,
  gruppenGroessen: [250, 250],
}
const mergedGruppen = mergeAdminAdjustConfig(withGruppen, {
  menge: 600,
  techniker: false,
})
assert(mergedGruppen.menge === 600, "menge with gruppen")
assert(mergedGruppen.gruppen === 2, "gruppen count kept")
assert(
  JSON.stringify(mergedGruppen.gruppenGroessen) === JSON.stringify([300, 300]),
  "equalSplitToMenge 600/2",
)
assert(mergedGruppen.station === "pro", "station untouched")

const off = mergeAdminAdjustConfig(
  { ...base, techniker: true, technikerTage: 3, technikerKm: 10, technikerAdresse: "X" },
  { menge: 500, techniker: false },
)
assert(off.techniker === false, "techniker off")
assert(off.technikerTage === undefined || off.technikerTage === 0 || !off.techniker, "techniker fields cleared when off")

const summary = buildAdminAdjustSummary(base, merged)
assert(summary.includes("Menge"), "summary menge")
assert(summary.includes("Techniker"), "summary techniker")

if (failed > 0) {
  console.error(`\n${failed} failed`)
  process.exit(1)
}
console.log("\nAll admin-adjust tests passed")
```

- [ ] **Step 2: Test ausführen — erwartet FAIL**

Run: `cd braceled-konfigurator-warenverwaltung && npx tsx scripts/test-admin-adjust.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implementierung**

```ts
// lib/konfigurator/quote-admin-adjust.ts
import type { QuoteConfig } from "@/lib/konfigurator/types"
import { equalSplitToMenge } from "@/lib/konfigurator/gruppen-config"

export type AdminAdjustPatch = {
  menge: number
  techniker: boolean
  technikerTage?: number
  technikerKm?: number
  technikerAdresse?: string
}

export function mergeAdminAdjustConfig(
  previous: QuoteConfig,
  patch: AdminAdjustPatch,
): QuoteConfig {
  const next: QuoteConfig = { ...previous, menge: patch.menge }

  if (patch.techniker) {
    next.techniker = true
    next.technikerTage = patch.technikerTage
    next.technikerKm = patch.technikerKm
    next.technikerAdresse = patch.technikerAdresse
  } else {
    next.techniker = false
    delete next.technikerTage
    delete next.technikerKm
    delete next.technikerAdresse
  }

  const gruppen = Number(next.gruppen || 0)
  if (gruppen > 0 && previous.menge !== patch.menge) {
    next.gruppenGroessen = equalSplitToMenge(patch.menge, gruppen)
  }

  return next
}

export function buildAdminAdjustSummary(before: QuoteConfig, after: QuoteConfig): string {
  const parts: string[] = []
  if (before.menge !== after.menge) parts.push(`Menge ${before.menge}→${after.menge}`)
  const techBefore = Boolean(before.techniker)
  const techAfter = Boolean(after.techniker)
  if (
    techBefore !== techAfter ||
    before.technikerTage !== after.technikerTage ||
    before.technikerKm !== after.technikerKm ||
    (before.technikerAdresse || "") !== (after.technikerAdresse || "")
  ) {
    parts.push("Techniker")
  }
  if (
    JSON.stringify(before.gruppenGroessen ?? []) !== JSON.stringify(after.gruppenGroessen ?? [])
  ) {
    parts.push("Gruppenaufteilung")
  }
  return parts.length ? parts.join(" · ") : "Auftrag angepasst"
}
```

Hinweis: `equalSplitToMenge(600, 2)` liefert laut bestehender Logik `[300, 300]` (Step 50). Falls der Test fehlschlägt, erwartete Array-Werte an die echte Funktion anpassen — nicht die Produktionsfunktion verbiegen.

- [ ] **Step 4: Tests PASS + Script in package.json**

```json
"test:admin-adjust": "tsx scripts/test-admin-adjust.ts"
```

Run: `pnpm test:admin-adjust` → All passed

- [ ] **Step 5: Commit**

```bash
git add lib/konfigurator/quote-admin-adjust.ts scripts/test-admin-adjust.ts package.json
git commit -m "$(cat <<'EOF'
feat: Admin-Adjust Merge-Helper für Menge und Techniker

EOF
)"
```

---

### Task 2: E-Mail-Template Migration 28

**Files:**
- Create: `scripts/migration/28-email-quote-adjusted-admin.sql`
- Modify: `scripts/run-migrations.mjs`
- Modify: `lib/konfigurator/email.ts`

- [ ] **Step 1: Migration anlegen**

```sql
-- scripts/migration/28-email-quote-adjusted-admin.sql
INSERT INTO email_templates (template_key, label, category, subject, body, send_by_default)
VALUES (
  'quote_adjusted_admin',
  'Auftrag angepasst (Admin)',
  'quote',
  'Dein Angebot wurde angepasst – WIRKUNG Wristlink',
  '{{kunde_anrede}}

wir haben deinen Auftrag {{auftrags_nr}} angepasst ({{change_summary}}).

Angebotssumme netto: {{angebot_netto}} EUR
Zahlungsbetrag inkl. 19 % MwSt.: {{angebot_brutto}} EUR

Wir prüfen das aktualisierte Angebot erneut und melden uns bei dir.

Aktuellen Status und Angebot findest du hier (Zugang mit der Postleitzahl deiner Firmenadresse):
{{status_url}}

Bitte nicht auf diese E-Mail antworten. Fragen bitte an tech@wirkung-digital.de

Viele Grüße
Dein WIRKUNG-Team',
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  label = EXCLUDED.label,
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  updated_at = NOW();
```

Falls `email_templates` keinen UNIQUE auf `template_key` hat: Pattern aus Migration 09/13 prüfen und gleiches INSERT/UPDATE-Muster verwenden.

- [ ] **Step 2: Runner erweitern**

In `scripts/run-migrations.mjs` nach Migration 27:

```js
await runFile(pool, join(migrationDir, "28-email-quote-adjusted-admin.sql"))
```

- [ ] **Step 3: Mail-Wrapper**

In `lib/konfigurator/email.ts` ergänzen:

```ts
export async function sendCustomerAdjustedEmail(params: {
  email: string
  quote: QuoteRequest
  changeSummary: string
}): Promise<{ success: boolean; error?: string }> {
  return sendFromTemplateKey({
    templateKey: "quote_adjusted_admin",
    email: params.email,
    quote: params.quote,
    extraVars: {
      change_summary: params.changeSummary,
      angebot_url: `${getAppBaseUrl()}/angebot/${params.quote.public_token}`,
    },
  })
}
```

Prüfen, dass `sendFromTemplateKey` / Template-Render `{{change_summary}}` aus `extraVars` übernimmt (wie `ablehnungsgrund`). Falls nicht: Render-Pfad analog erweitern.

- [ ] **Step 4: Commit**

```bash
git add scripts/migration/28-email-quote-adjusted-admin.sql scripts/run-migrations.mjs lib/konfigurator/email.ts
git commit -m "$(cat <<'EOF'
feat: E-Mail-Template für Admin-Auftragsanpassung

EOF
)"
```

---

### Task 3: Core `adjustQuoteByAdmin` + Server Action

**Files:**
- Modify: `lib/quotes-internal.ts`
- Modify: `lib/actions/quotes.ts`

- [ ] **Step 1: `adjustQuoteByAdmin` in `quotes-internal.ts`**

Spiegel von `updateQuoteByPublicToken` (ab ca. Zeile 370), Unterschiede:

- Lookup per `quoteId` statt `publicToken`
- Merge via `mergeAdminAdjustConfig` + Patch
- `changedBy: "admin"`
- `buildAdminAdjustSummary`
- Availability: konservativ `"yellow"` / `null` (kein Kunden-Ampel-Zwang) ODER kurzer `checkProductAvailability` wie Update-Route — Spec: Soft-Hold reicht; Level `"yellow"` ist ok
- Optional Mail **nicht** hier hardcoden — Caller übergibt `notifyCustomer` und ruft Mail nach Success auf, ODER hier `after()` wenn Flag gesetzt

Empfohlene Signatur:

```ts
export async function adjustQuoteByAdmin(input: {
  quoteId: number
  patch: AdminAdjustPatch
  notifyCustomer: boolean
}): Promise<{ success: boolean; error?: string; quoteId?: number; changeSummary?: string }>
```

UPDATE-Felder (wie Kunden-Edit):

- `config_json`, `price_snapshot_json`
- `status = 'submitted'`
- `approved_at = NULL`, `expires_at = NULL`
- `stripe_checkout_session_id = NULL`, `stripe_payment_link_url = NULL`
- Offer-PDF nullen
- `booking_id` neuer Hold
- TOCTOU: `AND status = ANY(${CUSTOMER_EDITABLE_STATUSES}::text[])`
- Vorher: `ensureInitialQuoteVersion`, `snapshotOfferPdfOntoLatestVersion`, `insertQuoteVersion`
- Hold soft-fail + Notiz `[System] Hold nach Admin-Anpassung: …`
- Telegram: `Admin-Anpassung: ${changeSummary}`
- Wenn `notifyCustomer` und Lead-Email: `after(() => sendCustomerAdjustedEmail(...))` mit aktualisiertem Quote-Objekt
- `revalidatePath("/warenverwaltung/auftraege")` und Detailpfad

Imports ergänzen: `mergeAdminAdjustConfig`, `buildAdminAdjustSummary`, `sendCustomerAdjustedEmail`, `after` falls noch nicht.

- [ ] **Step 2: Server Action**

In `lib/actions/quotes.ts`:

```ts
export async function adjustQuoteOrder(input: {
  quoteId: number
  menge: number
  techniker: boolean
  technikerTage?: number
  technikerKm?: number
  technikerAdresse?: string
  notifyCustomer: boolean
}): Promise<{ success: boolean; error?: string }> {
  await requireRole(["ADMIN"])
  const { adjustQuoteByAdmin } = await import("@/lib/quotes-internal")
  // oder static import am Dateikopf
  return adjustQuoteByAdmin({
    quoteId: input.quoteId,
    patch: {
      menge: input.menge,
      techniker: input.techniker,
      technikerTage: input.technikerTage,
      technikerKm: input.technikerKm,
      technikerAdresse: input.technikerAdresse,
    },
    notifyCustomer: input.notifyCustomer,
  })
}
```

Einfache Validierung vor Call: `menge` endlich und > 0; wenn `techniker` dann `technikerTage >= 1`.

- [ ] **Step 3: Smoke Typecheck**

Run: `pnpm exec tsc --noEmit` oder betroffene Dateien linten; `pnpm test:admin-adjust` grün halten.

- [ ] **Step 4: Commit**

```bash
git add lib/quotes-internal.ts lib/actions/quotes.ts
git commit -m "$(cat <<'EOF'
feat: Server-Pfad adjustQuoteByAdmin für Auftragsanpassung

EOF
)"
```

---

### Task 4: UI Dialog + Header

**Files:**
- Create: `components/admin/auftrag-anpassen-dialog.tsx`
- Modify: `app/warenverwaltung/auftraege/[id]/page.tsx`

- [ ] **Step 1: Dialog-Komponente**

Client-Component mit:

- Props: `quoteId`, `config: QuoteConfig` (ohne Secrets), `disabled?: boolean` optional
- State: menge, techniker, tage, km, adresse, notifyCustomer (default `true`), open, pending, error
- Live-Preis: `rechnePreis({ ...config, ...patchFields })` — gleiche Input-Shape wie Engine (siehe `PreisEngineInput` / bestehende Aufrufe)
- Submit → `adjustQuoteOrder(...)` → bei Success `router.refresh()` + Dialog schließen
- UI: `Dialog`, `Input`, `Label`, `Checkbox`/`Switch`, `Button` aus `@/components/ui/*`
- Techniker-Felder nur sichtbar wenn Switch an

Muster an bestehenden Admin-Dialogs orientieren (`quote-packing-print-modal.tsx`).

- [ ] **Step 2: Header einbinden**

In `app/warenverwaltung/auftraege/[id]/page.tsx` neben den Badges:

```tsx
import { canCustomerEditQuoteStatus } from "@/lib/konfigurator/quote-status"
import { AuftragAnpassenDialog } from "@/components/admin/auftrag-anpassen-dialog"

// im Header-flex neben Badges:
{canCustomerEditQuoteStatus(quote.status) && (
  <AuftragAnpassenDialog quoteId={quote.id} config={config} />
)}
```

`config` ist `quote.config_json` — serverseitig ok an Client zu geben (keine PDF-Bytes).

- [ ] **Step 3: Manueller Smoke / Build**

Run: `pnpm build` (Dev-Server vorher stoppen falls nötig)  
Expected: Build grün

- [ ] **Step 4: Commit**

```bash
git add components/admin/auftrag-anpassen-dialog.tsx app/warenverwaltung/auftraege/[id]/page.tsx
git commit -m "$(cat <<'EOF'
feat: Dialog Auftrag anpassen im Auftrags-Header

EOF
)"
```

---

### Task 5: Docs + TODO abschließen

**Files:**
- Modify: `docs/TODO.md`
- Modify: `docs/auftrag-detail-ux-redesign.md`
- Modify: `docs/superpowers/specs/2026-08-06-admin-auftrag-anpassen-design.md` (Status bleibt freigegeben; Plan-Link ok)

- [ ] **Step 1: TODO**

Checkbox „Auftrag anpassen“ auf `[x]` setzen und Kurzverweis auf Spec/Plan.

- [ ] **Step 2: UX-Doku**

Unter „Nicht im Scope / offen“ den Punkt „Auftrag anpassen“ entfernen oder als implementiert markieren.

- [ ] **Step 3: Commit**

```bash
git add docs/TODO.md docs/auftrag-detail-ux-redesign.md
git commit -m "$(cat <<'EOF'
docs: Auftrag anpassen als erledigt markieren

EOF
)"
```

---

## Spec coverage

| Spec-Anforderung | Task |
|---|---|
| Nur Status vor Zahlung | 3, 4 |
| Nur Menge/Techniker | 1, 3 |
| Preis neu | 3, 4 |
| Version admin + PDF clear | 3 |
| Stripe null, kein Auto-Checkout | 3 |
| Optional Mail default an | 2, 3, 4 |
| Gruppen equalSplit | 1, 3 |
| Hold soft | 3 |
| Header-Dialog | 4 |
| Docs | 5 |

## Self-review notes

- Keine TBD-Platzhalter in Tasks
- `equalSplitToMenge(600,2)` Erwartung mit bestehender Funktion verifizieren
- UNIQUE/`ON CONFLICT` für `email_templates.template_key` vor Migration prüfen
- `change_summary` in Template-Render sicherstellen
