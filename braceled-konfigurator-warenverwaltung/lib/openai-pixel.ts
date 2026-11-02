export const OAIQ_PIXEL_ID =
  process.env.NEXT_PUBLIC_OAIQ_PIXEL_ID || "U2RWosAHBHCr28aL3dcTs4"

export const OAIQ_SDK_URL = "https://bzrcdn.openai.com/sdk/oaiq.min.js"

/** Nur bei explizitem `NEXT_PUBLIC_OAIQ_DEBUG=true` (lokal/Staging). */
export function isOaiqDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_OAIQ_DEBUG === "true"
}

export type OaiqFn = {
  (...args: unknown[]): void
  q?: unknown[]
}

declare global {
  interface Window {
    oaiq?: OaiqFn
  }
}

/** Stub + Script wie vom OpenAI-Pixel-Setup, idempotent. */
export function ensureOaiqLoaded(pixelId: string, debug: boolean): void {
  if (typeof window === "undefined" || typeof document === "undefined") return

  if (!window.oaiq) {
    const q = function (...args: unknown[]) {
      q.q = q.q || []
      q.q.push(args)
    } as OaiqFn
    q.q = []
    window.oaiq = q
  }

  const existing = document.querySelector<HTMLScriptElement>(`script[data-oaiq-sdk="1"]`)
  if (!existing) {
    const script = document.createElement("script")
    script.async = true
    script.src = OAIQ_SDK_URL
    script.dataset.oaiqSdk = "1"
    const first = document.getElementsByTagName("script")[0]
    first?.parentNode?.insertBefore(script, first)
  }

  if (!document.documentElement.dataset.oaiqInitialized) {
    window.oaiq!("init", { pixelId, debug })
    document.documentElement.dataset.oaiqInitialized = "1"
  }
}

export function measureCheckoutStarted(): boolean {
  if (typeof window === "undefined" || typeof window.oaiq !== "function") return false
  window.oaiq("measure", "checkout_started", { type: "contents" })
  return true
}
