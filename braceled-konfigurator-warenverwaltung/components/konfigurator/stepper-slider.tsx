"use client"

import { useEffect, useState } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

function snapToStep(value: number, min: number, max: number, step: number): number {
  const clamped = Math.min(max, Math.max(min, value))
  if (step <= 0) return clamped
  const snapped = Math.round((clamped - min) / step) * step + min
  return Math.min(max, Math.max(min, snapped))
}

/** Großer Slider + −/Zahl/+ – robust auf Touch und Android-Firefox */
export function StepperSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  suffix,
  className,
  "aria-label": ariaLabel,
}: {
  value: number
  onChange: (next: number) => void
  min: number
  max: number
  step?: number
  disabled?: boolean
  suffix?: string
  className?: string
  "aria-label"?: string
}) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  function commit(raw: string) {
    const parsed = Number(String(raw).replace(/\./g, "").replace(",", "."))
    if (!Number.isFinite(parsed)) {
      setDraft(String(value))
      return
    }
    const next = snapToStep(parsed, min, max, step)
    setDraft(String(next))
    if (next !== value) onChange(next)
  }

  function bump(delta: number) {
    onChange(snapToStep(value + delta, min, max, step))
  }

  const atMin = value <= min
  const atMax = value >= max

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          disabled={disabled || atMin}
          onClick={() => bump(-step)}
          aria-label="Verringern"
        >
          <Minus className="h-5 w-5" />
        </Button>
        <div className="relative min-w-0 flex-1">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            disabled={disabled}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => commit(draft)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                commit(draft)
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            aria-label={ariaLabel}
            className={cn(
              "h-11 text-center text-base font-semibold tabular-nums",
              suffix && "pr-14",
            )}
          />
          {suffix ? (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
              {suffix}
            </span>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          disabled={disabled || atMax}
          onClick={() => bump(step)}
          aria-label="Erhöhen"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[Math.min(max, Math.max(min, value))]}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
        aria-label={ariaLabel}
      />
    </div>
  )
}
