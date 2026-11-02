"use client"

import { useEffect, useRef } from "react"
import { hasMarketingConsent, OAIQ_CHECKOUT_STARTED_KEY, readConsent } from "@/lib/cookie-consent"
import { ensureOaiqLoaded, isOaiqDebugEnabled, measureCheckoutStarted, OAIQ_PIXEL_ID } from "@/lib/openai-pixel"

function tryFireCheckoutStarted(alreadyFired: { current: boolean }): void {
  if (alreadyFired.current) return
  if (typeof window === "undefined") return
  if (window.localStorage.getItem(OAIQ_CHECKOUT_STARTED_KEY) === "1") {
    alreadyFired.current = true
    return
  }
  if (!hasMarketingConsent(readConsent())) return

  ensureOaiqLoaded(OAIQ_PIXEL_ID, isOaiqDebugEnabled())
  const ok = measureCheckoutStarted()
  if (ok) {
    window.localStorage.setItem(OAIQ_CHECKOUT_STARTED_KEY, "1")
    alreadyFired.current = true
  }
}

/**
 * Feuert `checkout_started` einmalig, sobald der Nutzer verifiziert
 * auf der Konfigurator-Hauptseite ist und Marketing-Consent vorliegt.
 */
export function TrackCheckoutStarted({ active }: { active: boolean }) {
  const fired = useRef(false)

  useEffect(() => {
    if (!active) return
    tryFireCheckoutStarted(fired)

    function onConsent() {
      tryFireCheckoutStarted(fired)
    }
    window.addEventListener("wristlink:cookie-consent", onConsent)
    return () => window.removeEventListener("wristlink:cookie-consent", onConsent)
  }, [active])

  return null
}
