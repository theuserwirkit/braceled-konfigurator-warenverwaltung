"use client"

import Image from "next/image"
import { AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function OptionCard({
  selected,
  onClick,
  title,
  description,
  badge,
  warning,
  priceHint,
  disabled,
  imageSrc,
  imageAlt,
  onInfoClick,
  infoLabel = "Details anzeigen",
  className,
}: {
  selected: boolean
  onClick: () => void
  title: string
  description: string
  badge?: string
  warning?: string
  priceHint?: string
  disabled?: boolean
  imageSrc?: string
  imageAlt?: string
  onInfoClick?: () => void
  infoLabel?: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex h-full w-full flex-col text-left rounded-lg border p-4 transition-all",
        disabled
          ? "opacity-50 cursor-not-allowed border-border bg-muted/30"
          : "hover:border-primary/50",
        !disabled && selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : !disabled
            ? "border-border bg-card"
            : "",
        className,
      )}
    >
      {imageSrc && (
        <div className="mb-3 flex h-28 items-center justify-center overflow-hidden rounded-md bg-muted/40 p-2">
          <Image
            src={imageSrc}
            alt={imageAlt ?? title}
            width={160}
            height={112}
            unoptimized
            className="max-h-24 w-auto object-contain bg-transparent"
            style={{ backgroundColor: "transparent" }}
          />
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium flex items-center gap-1.5">
          {title}
          {warning && (
            <AlertCircle
              className="h-4 w-4 shrink-0 text-amber-600"
              aria-label="Hinweis"
            />
          )}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {onInfoClick && (
            <span
              role="button"
              tabIndex={0}
              aria-label={infoLabel}
              onClick={(event) => {
                event.stopPropagation()
                onInfoClick()
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  event.stopPropagation()
                  onInfoClick()
                }
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground hover:border-foreground/30"
            >
              <Info className="h-5 w-5" />
            </span>
          )}
          {badge && (
            <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
      </div>
      <p className="mt-1.5 flex-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
      {warning && (
        <p className="mt-2 text-xs text-amber-700 leading-relaxed">{warning}</p>
      )}
      {priceHint && (
        <p className="mt-2 text-xs font-medium text-foreground">{priceHint}</p>
      )}
    </button>
  )
}
