import { cn } from "@/lib/utils"
import {
  buildLogisticsTimeline,
  type LogisticsMilestone,
} from "@/lib/konfigurator/logistics-timeline"
import type { QuoteConfig } from "@/lib/konfigurator/types"

function Dot({ kind }: { kind: LogisticsMilestone["kind"] }) {
  return (
    <span
      className={cn(
        "relative z-[1] flex h-3.5 w-3.5 shrink-0 rounded-full border-2 bg-background",
        kind === "today" && "border-[#14b8a6] bg-[#14b8a6]/20",
        kind === "event" && "border-[#7c3aed] bg-[#7c3aed]/25",
        kind === "return" && "border-amber-500 bg-amber-500/15",
        kind === "deadline" && "border-foreground/40",
      )}
      aria-hidden
    />
  )
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
  >
  className?: string
  compact?: boolean
}) {
  const milestones = buildLogisticsTimeline(config)
  if (milestones.length <= 1 && !config.von) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Zeitstrahl erscheint, sobald ein Eventdatum gesetzt ist.
      </p>
    )
  }

  return (
    <div className={cn("rounded-xl border bg-card/60 p-4", className)}>
      <p className={cn("font-medium text-foreground", compact ? "text-xs mb-3" : "text-sm mb-4")}>
        Produktion &amp; Logistik
      </p>
      <div className="overflow-x-auto pb-1">
        <ol className="flex min-w-max items-start gap-0">
          {milestones.map((m, i) => (
            <li key={m.id} className="flex items-start">
              <div className={cn("flex w-[7.25rem] flex-col items-center text-center", compact && "w-[6.5rem]")}>
                <Dot kind={m.kind} />
                <p
                  className={cn(
                    "mt-2 font-medium leading-snug text-foreground",
                    compact ? "text-[10px]" : "text-xs",
                  )}
                >
                  {m.label}
                </p>
                <p
                  className={cn(
                    "mt-0.5 tabular-nums text-muted-foreground",
                    compact ? "text-[10px]" : "text-xs",
                    m.kind === "event" && "font-semibold text-[#7c3aed]",
                  )}
                >
                  {m.dateLabel}
                </p>
              </div>
              {i < milestones.length - 1 && (
                <div
                  className="mt-[6px] h-0.5 w-4 shrink-0 bg-gradient-to-r from-foreground/25 to-foreground/10 sm:w-6"
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
