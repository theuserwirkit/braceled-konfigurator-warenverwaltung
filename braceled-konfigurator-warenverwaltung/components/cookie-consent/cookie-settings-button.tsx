"use client"

import { useCookieConsentOptional } from "@/components/cookie-consent/cookie-consent-provider"

/** Footer-/Legal-Link zum erneuten Öffnen des Consent-Banners. */
export function CookieSettingsButton({
  className,
}: {
  className?: string
}) {
  const consent = useCookieConsentOptional()
  if (!consent) return null

  return (
    <button type="button" className={className} onClick={() => consent.openSettings()}>
      Cookie-Einstellungen
    </button>
  )
}
