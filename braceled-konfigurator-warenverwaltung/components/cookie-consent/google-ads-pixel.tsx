"use client"

import { useEffect } from "react"
import { ensureGoogleAdsLoaded, GOOGLE_ADS_ID, isGoogleAdsConfigured } from "@/lib/google-ads"

/** Lädt Google Ads nur bei Marketing-Consent und konfigurierter ID. */
export function GoogleAdsPixel({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled || !isGoogleAdsConfigured()) return
    ensureGoogleAdsLoaded(GOOGLE_ADS_ID)
  }, [enabled])

  return null
}
