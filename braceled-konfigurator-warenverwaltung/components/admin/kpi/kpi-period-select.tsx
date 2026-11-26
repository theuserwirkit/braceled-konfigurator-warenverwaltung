"use client"

import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { INVENTORY_REPORT_MONTH_NAMES as MONTH_NAMES } from "@/components/print/inventory-report-print-view"

type KpiPeriodSelectProps = {
  periodKey: string
  currentYear: number
}

export function KpiPeriodSelect({ periodKey, currentYear }: KpiPeriodSelectProps) {
  const router = useRouter()
  const year = periodKey.slice(0, 4)
  const teil = periodKey.length > 4 ? periodKey.slice(5) : "gesamt"

  const years = Array.from({ length: currentYear - 2024 + 2 }, (_, i) => String(2024 + i))

  const navigate = (nextYear: string, nextTeil: string) => {
    const key = nextTeil === "gesamt" ? nextYear : `${nextYear}-${nextTeil}`
    router.push(`/admin/kpi?periode=${key}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={year} onValueChange={(v) => navigate(v, teil)}>
        <SelectTrigger className="w-[100px]" aria-label="Jahr">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={teil} onValueChange={(v) => navigate(year, v)}>
        <SelectTrigger className="w-[160px]" aria-label="Zeitraum">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gesamt">Gesamtjahr</SelectItem>
          {["Q1", "Q2", "Q3", "Q4"].map((q) => (
            <SelectItem key={q} value={q}>
              {q}
            </SelectItem>
          ))}
          {MONTH_NAMES.map((name, i) => (
            <SelectItem key={name} value={String(i + 1).padStart(2, "0")}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
