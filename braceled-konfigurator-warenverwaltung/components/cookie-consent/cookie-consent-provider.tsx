"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import {
  hasMarketingConsent,
  isConsentPublicPath,
  readConsent,
  writeConsent,
  type CookieConsentState,
} from "@/lib/cookie-consent"
import { CookieConsentBanner } from "@/components/cookie-consent/cookie-consent-banner"
import { OpenAIPixel } from "@/components/cookie-consent/openai-pixel"

type CookieConsentContextValue = {
  consent: CookieConsentState | null
  marketingEnabled: boolean
  openSettings: () => void
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) {
    throw new Error("useCookieConsent muss innerhalb von CookieConsentProvider verwendet werden")
  }
  return ctx
}

/** Optional: Footer-Links ohne Pflicht-Provider-Crash. */
export function useCookieConsentOptional(): CookieConsentContextValue | null {
  return useContext(CookieConsentContext)
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/"
  const publicPath = isConsentPublicPath(pathname)

  const [consent, setConsent] = useState<CookieConsentState | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draftMarketing, setDraftMarketing] = useState(false)

  useEffect(() => {
    const existing = readConsent()
    setConsent(existing)
    setDraftMarketing(existing?.marketing ?? false)
    setHydrated(true)

    function onExternal() {
      const next = readConsent()
      setConsent(next)
      setDraftMarketing(next?.marketing ?? false)
    }
    window.addEventListener("wristlink:cookie-consent", onExternal)
    window.addEventListener("storage", onExternal)
    return () => {
      window.removeEventListener("wristlink:cookie-consent", onExternal)
      window.removeEventListener("storage", onExternal)
    }
  }, [])

  const openSettings = useCallback(() => {
    setDraftMarketing(consent?.marketing ?? false)
    setSettingsOpen(true)
  }, [consent?.marketing])

  const persist = useCallback((marketing: boolean) => {
    const next = writeConsent(marketing)
    setConsent(next)
    setDraftMarketing(marketing)
    setSettingsOpen(false)
  }, [])

  const showBanner =
    publicPath && hydrated && (settingsOpen || consent === null)

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      marketingEnabled: publicPath && hasMarketingConsent(consent),
      openSettings,
    }),
    [consent, openSettings, publicPath],
  )

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {publicPath && <OpenAIPixel enabled={value.marketingEnabled} />}
      {showBanner && (
        <CookieConsentBanner
          marketing={draftMarketing}
          onMarketingChange={setDraftMarketing}
          onSave={() => persist(draftMarketing)}
          onAcceptAll={() => persist(true)}
          onRejectOptional={() => persist(false)}
        />
      )}
    </CookieConsentContext.Provider>
  )
}
