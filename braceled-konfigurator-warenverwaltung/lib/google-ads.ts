/** Google Ads (gtag) – nur nach Marketing-Consent laden. */

export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || ""

export function isGoogleAdsConfigured(): boolean {
  return /^AW-\d+$/.test(GOOGLE_ADS_ID)
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/** Idempotent: gtag-Stub + Script + config. */
export function ensureGoogleAdsLoaded(adsId: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return
  if (!adsId) return

  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args)
    }
  }

  if (!document.documentElement.dataset.gtagConfigured) {
    window.gtag("js", new Date())
    window.gtag("config", adsId)
    document.documentElement.dataset.gtagConfigured = adsId
  }

  const src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(adsId)}`
  if (!document.querySelector(`script[data-google-ads="1"]`)) {
    const script = document.createElement("script")
    script.async = true
    script.src = src
    script.dataset.googleAds = "1"
    const first = document.getElementsByTagName("script")[0]
    first?.parentNode?.insertBefore(script, first)
  }
}
