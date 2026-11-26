"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { KpiDashboard } from "@/lib/kpi/aggregate"
import { COST_KATEGORIE_LABELS } from "@/lib/kpi/aggregate"

const COLORS = {
  primary: "#6366f1",
  primarySoft: "#c7d2fe",
  green: "#16a34a",
  greenSoft: "#bbf7d0",
  amber: "#f59e0b",
  amberSoft: "#fde68a",
  slate: "#64748b",
  red: "#dc2626",
}

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
const stk = new Intl.NumberFormat("de-DE")

const formatEurTick = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v))

function ChartFrame({ children, height = 280 }: { children: React.ReactElement; height?: number }) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  )
}

export function AnfragenVerlaufChart({ data }: { data: KpiDashboard["anfragen"]["verlauf"] }) {
  return (
    <ChartFrame height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis allowDecimals={false} fontSize={12} width={32} />
        <Tooltip />
        <Legend />
        <Bar dataKey="eingang" name="Eingang" fill={COLORS.primarySoft} />
        <Bar dataKey="bezahlt" name="Bezahlt" fill={COLORS.primary} />
      </BarChart>
    </ChartFrame>
  )
}

export function BaenderWochenChart({
  data,
  bestand,
}: {
  data: KpiDashboard["baender"]["wochen"]
  bestand: number
}) {
  const rows = data.map((w) => ({ ...w, bestand }))
  return (
    <ChartFrame height={320}>
      <ComposedChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" fontSize={11} interval="preserveStartEnd" />
        <YAxis fontSize={12} width={48} tickFormatter={(v) => stk.format(v)} />
        <Tooltip formatter={(v) => stk.format(Number(v))} />
        <Legend />
        <Bar dataKey="mieteGebucht" name="Miete gebucht" stackId="b" fill={COLORS.primary} />
        <Bar dataKey="mieteOffen" name="Miete offen" stackId="b" fill={COLORS.primarySoft} />
        <Bar dataKey="kaufGebucht" name="Kauf gebucht" stackId="b" fill={COLORS.amber} />
        <Bar dataKey="kaufOffen" name="Kauf offen" stackId="b" fill={COLORS.amberSoft} />
        <Line
          dataKey="bestand"
          name="Bestand gesamt"
          stroke={COLORS.red}
          strokeDasharray="6 4"
          dot={false}
          type="stepAfter"
        />
      </ComposedChart>
    </ChartFrame>
  )
}

export function UmsatzChart({ data }: { data: KpiDashboard["umsatz"]["monate"] }) {
  return (
    <ChartFrame>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis fontSize={12} width={48} tickFormatter={formatEurTick} />
        <Tooltip formatter={(v) => eur.format(Number(v))} />
        <Legend />
        <Bar dataKey="soll" name="Soll (Angebotssumme)" fill={COLORS.greenSoft} />
        <Bar dataKey="ist" name="Ist (bezahlt)" fill={COLORS.green} />
      </BarChart>
    </ChartFrame>
  )
}

export function KostenChart({ data }: { data: KpiDashboard["kosten"]["monate"] }) {
  const palette = [COLORS.primary, COLORS.amber, COLORS.slate, COLORS.green, COLORS.red]
  return (
    <ChartFrame>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis fontSize={12} width={48} tickFormatter={formatEurTick} />
        <Tooltip formatter={(v) => eur.format(Number(v))} />
        <Legend />
        {(Object.keys(COST_KATEGORIE_LABELS) as Array<keyof typeof COST_KATEGORIE_LABELS>).map((key, i) => (
          <Bar key={key} dataKey={key} name={COST_KATEGORIE_LABELS[key]} stackId="k" fill={palette[i]} />
        ))}
      </BarChart>
    </ChartFrame>
  )
}
