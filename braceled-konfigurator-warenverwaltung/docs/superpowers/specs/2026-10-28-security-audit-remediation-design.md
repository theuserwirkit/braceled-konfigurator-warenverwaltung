# Security Audit Remediation

**Branch:** `feature/security-audit-fixes`  
**Für Nicht-ITler:** Hintertüren zu, Kundenzugang weiter per geheimem Link + PLZ, Zahlungen zuverlässiger, Schlüssel getrennt.

## Fixes

1. **Lead auto-verify:** `getOrCreateVerifiedLeadForEmail` aus `"use server"` raus → `lib/actions/leads-internal.ts` (`server-only`). Nur interne/API/ADMIN-Caller.
2. **Fulfillment:** `getPublicFulfillmentEvents(publicToken)` + `hasAngebotAccess(token)` (PLZ-Cookie bzw. kein Gate wenn kein PLZ). Kein nacktes `quoteId`. URL bleibt `/angebot/{uuid}` (bereits kryptisch UUID).
3. **Stats/Templates:** `getQuoteRequestStats` → `requireRole(["ADMIN"])`; `getTotalStats`/`getBaseTotalStats` → `ensureAuthed`; E-Mail-Template-Reexport entfernen.
4. **Testmode Action:** Gleiches Secret wie Route (`KONFIGURATOR_TESTMODE_SECRET`) in Production; Action akzeptiert Secret-Parameter oder nur via Route.
5. **Stripe:** `event_id` erst nach erfolgreichem Paid-Finalize; bei Fehler HTTP 5xx damit Stripe retryt; Idempotenz beibehalten.
6. **Secrets:** In Production kein Fallback auf `WRISTLINK_PASSWORD` für Session/Lead/Angebot — dedizierte Secrets Pflicht.
7. **API-Keys:** `WRISTLINK_API_KEY` = automation (availability, bookings, create/get quotes). Approve/Reject brauchen `WRISTLINK_API_KEY_APPROVE` (fail-closed wenn unset).

## Tests

Contract-Scripts unter `scripts/test-security-remediation.ts` + bestehende Tests.
