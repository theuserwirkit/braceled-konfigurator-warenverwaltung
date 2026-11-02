"use client"

import { useEffect } from "react"
import {
  ensureOaiqLoaded,
  isOaiqDebugEnabled,
  OAIQ_PIXEL_ID,
} from "@/lib/openai-pixel"

/** Lädt das OpenAI-Pixel nur, wenn Marketing-Consent aktiv ist (einmal pro Seite). */
export function OpenAIPixel({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return
    ensureOaiqLoaded(OAIQ_PIXEL_ID, isOaiqDebugEnabled())
  }, [enabled])

  return null
}
