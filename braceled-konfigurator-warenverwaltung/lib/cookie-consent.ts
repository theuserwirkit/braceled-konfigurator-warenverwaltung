/** Cookie-/Tracking-Consent (Client, localStorage). */

export const CONSENT_STORAGE_KEY = "wristlink_cookie_consent"
export const CONSENT_VERSION = 1
/** Ca. 12 Monate – erneute Abfrage danach. */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

export const OAIQ_CHECKOUT_STARTED_KEY = "oaiq_checkout_started"

export type CookieConsentState = {
  version: number
  necessary: true
  marketing: boolean
  updatedAt: number
}

const INTERNAL_PREFIXES = [
  "/admin",
  "/warenverwaltung",
  "/login",
  "/kalender",
  "/protocol",
]

export function isConsentPublicPath(pathname: string): boolean {
  if (!pathname) return false
  return !INTERNAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function isConsentExpired(state: CookieConsentState, now = Date.now()): boolean {
  return now - state.updatedAt > CONSENT_MAX_AGE_MS
}

export function readConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>
    if (
      parsed.version !== CONSENT_VERSION ||
      parsed.necessary !== true ||
      typeof parsed.marketing !== "boolean" ||
      typeof parsed.updatedAt !== "number"
    ) {
      return null
    }
    const state: CookieConsentState = {
      version: CONSENT_VERSION,
      necessary: true,
      marketing: parsed.marketing,
      updatedAt: parsed.updatedAt,
    }
    if (isConsentExpired(state)) return null
    return state
  } catch {
    return null
  }
}

export function writeConsent(marketing: boolean): CookieConsentState {
  const state: CookieConsentState = {
    version: CONSENT_VERSION,
    necessary: true,
    marketing,
    updatedAt: Date.now(),
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state))
    window.dispatchEvent(new CustomEvent("wristlink:cookie-consent", { detail: state }))
  }
  return state
}

export function hasMarketingConsent(state: CookieConsentState | null = readConsent()): boolean {
  return Boolean(state?.marketing)
}
