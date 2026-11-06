"use client"

import { cn } from "@/lib/utils"
import {
  activeJourneyPhaseIndex,
  buildLogisticsJourney,
  buildLogisticsTimeline,
  type LogisticsOwner,
} from "@/lib/konfigurator/logistics-timeline"
import { normalizeLieferpaket } from "@/lib/konfigurator/lieferpaket"
import type { QuoteConfig } from "@/lib/konfigurator/types"

const OWNER_STYLES: Record<
  LogisticsOwner,
  { chip: string; chipActive: string; dot: string; label: string }
> = {
  kunde: {
    chip: "border-emerald-200/80 bg-emerald-50/80 text-emerald-950",
    chipActive: "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/25 shadow-sm",
    dot: "border-emerald-600 bg-emerald-500",
    label: "text-emerald-900",
  },
  braceled: {
    chip: "border-violet-200/80 bg-violet-50/80 text-violet-950",
    chipActive: "border-violet-500 bg-violet-50 ring-1 ring-violet-400/30 shadow-sm",
    dot: "border-violet-600 bg-violet-500",
    label: "text-violet-800",
  },
  logistik: {
    chip: "border-sky-200/80 bg-sky-50/80 text-sky-950",
    chipActive: "border-sky-500 bg-sky-50 ring-1 ring-sky-500/25 shadow-sm",
    dot: "border-sky-600 bg-sky-500",
    label: "text-sky-900",
  },
}

function ownerDisplayLabel(
  owner: LogisticsOwner,
  kundenfirma: string | undefined,
): string {
  if (owner === "kunde") {
    const name = kundenfirma?.trim()
    return name || "Ihre Firma"
  }
  if (owner === "braceled") return "BraceLED"
  return "Logistik"
}

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
    | "kontaktFirma"
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

  return (
    <div
      className={cn(
        "w-full min-w-0 max-w-full rounded-xl border bg-gradient-to-b from-card to-muted/20 p-4",
        className,
      )}
    >
      <div className="mb-3">
        <p
          className={cn(
            "font-medium text-foreground",
            compact ? "text-xs" : "text-sm",
          )}
        >
          Ihre Logistik-Reise
        </p>
      </div>

      <ol className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {phases.map((phase, i) => {
          const done = i < activeIdx
          const active = i === activeIdx
          const style = OWNER_STYLES[phase.owner]

          return (
            <li
              key={phase.id}
              className={cn(
                "relative flex min-w-0 flex-col rounded-lg border px-2.5 py-2.5 transition-all duration-300",
                style.chip,
                active && style.chipActive,
                done && "opacity-50",
              )}
            >
              <div className="mb-1.5 flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full border-2",
                    done ? "border-foreground/25 bg-foreground/15" : style.dot,
                  )}
                  aria-hidden
                />
                <span className="truncate text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                  {ownerDisplayLabel(phase.owner, config.kontaktFirma)}
                </span>
              </div>
              <p className={cn("text-[11px] font-semibold leading-snug", style.label)}>
                {phase.label}
              </p>
              <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                {phase.dateLabel}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
