# Canonical Miete Write Availability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Miet-Write-Check nutzt einen klaren Helper: Ausgabedatum Pflicht, Rückgabe-Fallback +3 Tage, Kalender+Buffer wie Ampel.

**Architecture:** Pure `resolveMieteBookingWindow` in `lib/utils/booking.ts`; `createBookingInternal` ruft Helper + bestehende `getAvailabilityForGroupBatchesByDateRange` auf. VERKAUF unverändert Punktbestand.

**Tech Stack:** TypeScript, bestehende `tsx`-Script-Tests, Next.js Server Actions / internal booking path.

---

### Task 1: Pure Fenster-Helper + Unit-Test

**Files:**
- Create/Modify: `lib/utils/booking.ts`
- Create: `scripts/test-miete-booking-window.ts`
- Modify: `package.json` (script `test:miete-window`)

- [x] **Step 1: Failing test** – `resolveMieteBookingWindow` ohne ausgabe → error; mit ausgabe ohne rückgabe → +3 Tage; mit beiden → unverändert
- [x] **Step 2: Implement helper**
- [x] **Step 3: Run `pnpm test:miete-window` → PASS**

### Task 2: Wire createBookingInternal

**Files:**
- Modify: `lib/actions/bookings-internal.ts`
- Modify: `scripts/test-miete-lock-availability.ts` (Assert Helper-Nutzung / Fehlermeldung Ausgabedatum)

- [x] **Step 1: Update contract test** for Pflicht-Ausgabedatum / resolveMieteBookingWindow
- [x] **Step 2: Wire helper in MIETE block**
- [x] **Step 3: `pnpm test:miete-lock` + `pnpm test:miete-window` → PASS**
