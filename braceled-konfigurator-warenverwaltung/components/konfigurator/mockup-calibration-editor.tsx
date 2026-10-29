"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  type WristbandPrintCalibration,
  clearWristbandCalibration,
  formatCalibrationForCopy,
  getPrintCalibrationForProdukt,
  saveWristbandCalibration,
} from "@/lib/konfigurator/mockup-calibration"

type FieldKey = keyof WristbandPrintCalibration

const FIELDS: { key: FieldKey; label: string; min: number; max: number; step: number }[] = [
  { key: "left", label: "Left %", min: 0, max: 80, step: 0.25 },
  { key: "top", label: "Top %", min: 0, max: 80, step: 0.25 },
  { key: "width", label: "Width %", min: 5, max: 40, step: 0.25 },
  { key: "height", label: "Height %", min: 5, max: 40, step: 0.25 },
  { key: "rotateX", label: "Rotate X °", min: -30, max: 30, step: 0.5 },
  { key: "rotateZ", label: "Rotate Z °", min: -30, max: 30, step: 0.5 },
]

export function MockupCalibrationEditor({
  produkt,
  value,
  onChange,
}: {
  produkt: string
  value: WristbandPrintCalibration
  onChange: (next: WristbandPrintCalibration) => void
}) {
  const [copied, setCopied] = useState(false)

  function setField(key: FieldKey, raw: number) {
    const next = { ...value, [key]: Math.round(raw * 100) / 100 }
    onChange(next)
    saveWristbandCalibration(next, produkt)
  }

  async function copyValues() {
    const text = formatCalibrationForCopy(value)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt("Kalibrierung kopieren:", text)
    }
  }

  function resetDefaults() {
    clearWristbandCalibration(produkt)
    onChange(getPrintCalibrationForProdukt(produkt))
  }

  return (
    <div className="rounded-lg border border-amber-400/60 bg-amber-50 px-3 py-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-amber-950">Mock-up-Kalibrierung</p>
          <p className="text-[11px] text-amber-900/80 mt-0.5">
            Nur mit <code className="text-[10px]">?mockupCalibrate=1</code> sichtbar. Werte
            kopieren und in <code className="text-[10px]">mockup-calibration.ts</code>{" "}
            eintragen.
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button type="button" size="sm" variant="outline" onClick={resetDefaults}>
            Reset
          </Button>
          <Button type="button" size="sm" onClick={copyValues}>
            {copied ? "Kopiert" : "Kopieren"}
          </Button>
        </div>
      </div>

      <p className="font-mono text-[11px] break-all text-amber-950/90 bg-white/70 rounded px-2 py-1.5 border border-amber-200">
        {formatCalibrationForCopy(value)}
      </p>

      <div className="space-y-3">
        {FIELDS.map(({ key, label, min, max, step }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <Label className="text-[11px]">{label}</Label>
              <span className="font-mono tabular-nums">{value[key]}</span>
            </div>
            <Slider
              min={min}
              max={max}
              step={step}
              value={[value[key]]}
              onValueChange={([v]) => setField(key, v ?? value[key])}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
