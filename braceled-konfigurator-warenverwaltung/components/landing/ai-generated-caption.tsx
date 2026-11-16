import { AI_GENERATED_CAPTION, isAiGeneratedLandingImage } from "@/lib/landing/content"
import { cn } from "@/lib/utils"

/** Sichtbare Kennzeichnung unter KI-Bildern (inhaltlich, keine Deko). */
export function AiGeneratedCaption({
  src,
  className,
  force = false,
}: {
  src?: string
  className?: string
  /** Wenn true, Caption immer zeigen (ohne src-Check). */
  force?: boolean
}) {
  if (!force && (!src || !isAiGeneratedLandingImage(src))) return null

  return (
    <figcaption className={cn("lp-ai-caption", className)}>
      {AI_GENERATED_CAPTION}
    </figcaption>
  )
}
