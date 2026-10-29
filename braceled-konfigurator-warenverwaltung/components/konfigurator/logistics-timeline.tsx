"use client"

import { cn } from "@/lib/utils"
import {
  activeJourneyPhaseIndex,
  buildLogisticsJourney,
  buildLogisticsTimeline,
} from "@/lib/konfigurator/logistics-timeline"
import { normalizeLieferpaket } from "@/lib/konfigurator/lieferpaket"
import type { QuoteConfig } from "@/lib/konfigurator/types"

export function LogisticsTimeline({
  config,
  className,
  compact = false,
}: {
  config: Pick<
    QuoteConfig,
    | "von"
    | "bis"
    | "druck"
    | "lieferpaket"
    | "lieferzeit"
    | "lieferart"
    | "flexRueckgabe"
    | "flex"
  >
  className?: string
  compact?: boolean
}) {
  const milestones = buildLogisticsTimeline(config)
  const paket = normalizeLieferpaket(config)
  const phases = buildLogisticsJourney(milestones, paket)
  const activeIdx = activeJourneyPhaseIndex(phases)

  if (!config.von) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Zeitstrahl erscheint, sobald ein Eventdatum gesetzt ist.
      </p>
    )
  }

  const isEil = paket === "eil"

  return (
    <div
      className={cn(
        "w-full min-w-0 max-w-full rounded-xl border bg-gradient-to-b from-card to-muted/30 p-4 transition-colors",
        isEil && "border-violet-300/70 from-violet-50/40 to-card",
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p
          className={cn(
            "font-medium text-foreground",
            compact ? "text-xs" : "text-sm",
          )}
        >
          Ihre Logistik-Reise
        </p>
        <p className="text-[11px] text-muted-foreground">
          {isEil ? "Eilauftrag · 48h-Sprint" : paket === "express" ? "Express" : "Regulär"}
        </p>
      </div>

      <ol className="grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {phases.map((phase, i) => {
          const done = i < activeIdx
          const active = i === activeIdx
          const isEvent = phase.kind === "event"
          const isReturn = phase.kind === "return"
          const isSprint = Boolean(phase.sprint)

          return (
            <li
              key={phase.id}
              className={cn(
                "relative flex min-w-0 flex-col rounded-lg border px-2.5 py-2.5 transition-all duration-300",
                done && "border-transparent bg-muted/40 opacity-55",
                active &&
                  !isEvent &&
                  !isReturn &&
                  "border-teal-500/50 bg-teal-50/50 shadow-sm ring-1 ring-teal-500/20",
                active && isEvent && "border-violet-500 bg-violet-50 ring-1 ring-violet-400/30",
                active && isReturn && "border-amber-500/60 bg-amber-50/70 ring-1 ring-amber-400/25",
                !done &&
                  !active &&
                  "border-border/70 bg-background/70",
                isSprint && active && "border-violet-400/60 bg-violet-50/60 ring-violet-300/30",
                isSprint && "sm:col-span-1",
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full border-2",
                    done && "border-foreground/30 bg-foreground/20",
                    active && isEvent && "border-violet-600 bg-violet-500",
                    active && isReturn && "border-amber-600 bg-amber-500",
                    active && !isEvent && !isReturn && "border-teal-600 bg-teal-500",
                    !done && !active && "border-foreground/25 bg-background",
                  )}
                  aria-hidden
                />
                {i < phases.length - 1 && (
                  <span
                    className={cn(
                      "hidden h-0.5 flex-1 rounded-full md:block",
                      done || active ? "bg-foreground/25" : "bg-border",
                    )}
                    aria-hidden
                  />
                )}
              </div>
              <p
                className={cn(
                  "text-[11px] font-semibold leading-snug",
                  isEvent && "text-violet-700",
                  isReturn && "text-amber-800",
                  !isEvent && !isReturn && "text-foreground",
                )}
              >
                {phase.label}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-[11px] tabular-nums text-muted-foreground",
                  active && isEvent && "font-semibold text-violet-700",
                )}
              >
                {phase.dateLabel}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
