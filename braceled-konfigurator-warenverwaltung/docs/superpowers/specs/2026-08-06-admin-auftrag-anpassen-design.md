# Admin: Auftrag anpassen (Menge / Techniker)

**Datum:** 2026-08-06  
**Status:** Freigegeben  
**Plan:** `docs/superpowers/plans/2026-08-06-admin-auftrag-anpassen.md`  
**Verwandt:** `docs/superpowers/specs/2026-07-16-customer-quote-edit-design.md` (Versionierung, Status-Reset, Stripe-Nullung)

**Kontext:** Auftragsdetail `/warenverwaltung/auftraege/[id]` — Header-Aktion für Admin vor Zahlung.

## Problem

Admins müssen vor Zahlung Menge oder Techniker korrigieren können, ohne den Kunden-Edit-Pfad zu missbrauchen. Heute fehlt die Header-Aktion „Auftrag anpassen“; Preis, Version und Kundeninfo bleiben manuell.

## Ziel

Auth’ed Admin ändert auf der Auftragsdetailseite **nur Menge und Techniker**, Preis wird neu berechnet, Version wie Kunden-Edit geschrieben, optional Kunden-Mail. Status zurück auf Prüfung; alter Stripe-Link ungültig.

## Nicht-Ziele

- Kein Ändern nach `paid` / `rejected` / `expired` / `cancelled`
- Keine weiteren Config-Felder (Datum, Produkt, Gruppen-UI, Druck, Lieferpaket, Kontakt, …)
- Kein automatischer neuer Stripe-Checkout beim Speichern (erneute Freigabe wie bisher)
- Kein Bestands-Engine-Umbau
- Kein Ersatz für Kunden-Edit

## Festgelegte Entscheidungen

| Thema | Entscheidung |
|---|---|
| Status-Fenster | `submitted`, `approved`, `payment_pending` (identisch Kunden-Edit) |
| Felder | `menge`; `techniker`, `technikerTage`, `technikerKm`, `technikerAdresse` |
| Nach Speichern | Status → `submitted`; Stripe-Session/-Link null; Angebots-PDF auf Quote null; Version `changed_by=admin` |
| Stripe neu | Nicht beim Adjust; Admin freigibt später erneut (mit/ohne Stripe) |
| Kunden-Mail | Checkbox im Dialog, **Default an**; neues Template `quote_adjusted_admin` |
| Gruppen bei Mengenänderung | Wenn `gruppen > 0`: `gruppenGroessen` per `equalSplitToMenge(menge, gruppen)` neu setzen (Summe bleibt gültig) |
| Hold | Wie Kunden-Edit: alte ANFRAGE lösen, neuen Hold versuchen; Fail soft + System-Notiz |
| UI | Button im Header → Dialog/Sheet |
| Versionierung | `ensureInitialQuoteVersion` → PDF-Snapshot auf letzte Version → `insertQuoteVersion` |

## Ablauf

```text
/warenverwaltung/auftraege/[id]
  Header: Button „Auftrag anpassen“ (nur editierbare Status)
       │
       ▼
  Dialog
    · Menge
    · Techniker an/aus + Tage / Km / Adresse
    · Live-Preisvorschau (Client via rechnePreis oder Server-Preview)
    · Checkbox „Kunde per E-Mail informieren“ (default checked)
       │
       ▼
  Server Action adjustQuoteOrder(quoteId, patch, { notifyCustomer })
       · requireRole ADMIN
       · Status-Guard (TOCTOU wie Kunden-Edit)
       · mergeAdminAdjustConfig(previous, patch) — nur erlaubte Keys
       · bei Mengenänderung + gruppen>0: equalSplitToMenge
       · rechnePreis; bei !gueltig → Fehler
       · Version + PDF-Invalidate + Hold + UPDATE → submitted
       · Telegram an Team
       · wenn notifyCustomer: Template quote_adjusted_admin (after())
       │
       ▼
  revalidatePath + Dialog zu
```

## Daten / API

### Merge-Helper `lib/konfigurator/quote-admin-adjust.ts`

- `ADMIN_ADJUST_KEYS` bzw. Merge: nur Menge/Techniker-Felder aus Patch übernehmen; Rest aus `previous`
- `buildAdminAdjustSummary(before, after)` für Version `change_summary`
- Keine Client-seitige „volle Config“ — Patch ist schmal (Zod)

### Server Action

`adjustQuoteOrder` in `lib/actions/quotes.ts` (Auth-Wrapper) → Logik in `lib/quotes-internal.ts` (`adjustQuoteByAdmin`), analog `updateQuoteByPublicToken`.

Input (Zod):

```ts
{
  quoteId: number
  menge: number
  techniker: boolean
  technikerTage?: number
  technikerKm?: number
  technikerAdresse?: string
  notifyCustomer: boolean
}
```

### E-Mail

Migration `28-email-quote-adjusted-admin.sql`: Template `quote_adjusted_admin`  
Platzhalter wie Freigabe-Mails: `{{kunde_anrede}}`, `{{menge}}`, `{{angebot_netto}}`, `{{angebot_brutto}}`, `{{status_url}}`, `{{change_summary}}`, `{{auftrags_nr}}`  
Betreff/Body: Du-Ansprache, Hinweis auf angepasstes Angebot / erneute Prüfung, Link zur Statusseite.

## UI

- Button neben Badges im Header von `app/warenverwaltung/auftraege/[id]/page.tsx` (Client-Komponente `AuftragAnpassenDialog`)
- Sichtbar nur bei `canCustomerEditQuoteStatus(status)` (gleiche Liste)
- Dialog: bestehende UI-Primitives (`Dialog`, `Input`, `Switch`/`Checkbox`, `Button`)
- Preisvorschau: `rechnePreis` clientseitig auf gemergter Config (Import der pure function) oder kurzer Preview-Endpoint — bevorzugt pure `rechnePreis` ohne Roundtrip
- Fehler inline; Success: toast/refresh (`router.refresh()`)

## Fehlerfälle

| Fall | Verhalten |
|---|---|
| Falscher Status | 409 / `{ success:false, error }` |
| Ungültige Menge / Techniker-Preis | Fehler aus `rechnePreis.fehler` |
| Parallel paid/rejected | TOCTOU-UPDATE greift nicht; Hold rollback |
| Hold fail | Soft: Quote gespeichert, Notiz `[System] Hold nach Admin-Anpassung: …` |
| Mail fail | Adjust bleibt erfolgreich; Fehler nur loggen (`after`) |

## Tests

- Unit: `mergeAdminAdjustConfig` lockt Fremdfelder; Mengenänderung setzt Gruppen-Split; Summary
- Unit/Script: analog `scripts/test-quote-versions.ts` erweitern oder `scripts/test-admin-adjust.ts`
- Manuell: Dialog auf `submitted`-Auftrag; mit/ohne Notify; `payment_pending` nullt Stripe

## Erfolgskriterien

1. Header-Button nur vor Zahlung  
2. Nur Menge/Techniker landen in `config_json`  
3. Preis + Version (`admin`) + PDF-Clear + Status `submitted`  
4. Optional Mail; Default-Checkbox an  
5. Bestehende Kunden-Edit- und Freigabe-Pfade unverändert  

## Betroffene Bereiche

| Bereich | Dateien (Orientierung) |
|---|---|
| Merge/Summary | `lib/konfigurator/quote-admin-adjust.ts` (neu) |
| Core | `lib/quotes-internal.ts` |
| Action | `lib/actions/quotes.ts` |
| UI | `components/admin/auftrag-anpassen-dialog.tsx` (neu), `app/warenverwaltung/auftraege/[id]/page.tsx` |
| Mail | Migration 28, `sendTemplatedEmail` / Wrapper |
| Docs | `docs/TODO.md`, `docs/auftrag-detail-ux-redesign.md`, ggf. Mitarbeiter-Anleitung |
