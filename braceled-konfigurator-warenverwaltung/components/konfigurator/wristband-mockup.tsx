"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { PrintPreviewLogoImage } from "@/components/konfigurator/print-preview-logo"
import { MockupCalibrationEditor } from "@/components/konfigurator/mockup-calibration-editor"
import { getWristbandMockupUrl } from "@/lib/konfigurator/product-info"
import {
  type WristbandPrintCalibration,
  getPrintCalibrationForProdukt,
  getPrintOverlayRect,
  loadWristbandCalibration,
  readMockupCalibrateFromLocation,
} from "@/lib/konfigurator/mockup-calibration"

export function WristbandMockup({
  printPreviewUrl,
  previewLoading,
  produkt = "armband",
  forceCalibrate = false,
}: {
  printPreviewUrl: string | null
  previewLoading?: boolean
  produkt?: string
  /** Kalibrier-UI auch ohne Query-Param erzwingen (z. B. Dev-Panel) */
  forceCalibrate?: boolean
}) {
  const mockupUrl = getWristbandMockupUrl(produkt)
  const [calibrate, setCalibrate] = useState(forceCalibrate)
  const [cal, setCal] = useState<WristbandPrintCalibration>(() =>
    getPrintCalibrationForProdukt(produkt),
  )
  const overlay = getPrintOverlayRect(cal)
  const alt = produkt === "textilband" ? "LED Textilarmband" : "LED Armband"

  useEffect(() => {
    const enabled = forceCalibrate || readMockupCalibrateFromLocation()
    setCalibrate(enabled)
    setCal(
      enabled
        ? loadWristbandCalibration(produkt)
        : getPrintCalibrationForProdukt(produkt),
    )
  }, [produkt, forceCalibrate])

  return (
    <div className="space-y-3">
      <div className="rounded-lg border overflow-hidden bg-black">
        <p className="text-[10px] uppercase tracking-wider text-zinc-400 text-center py-2 bg-zinc-950 border-b border-zinc-800">
          Produkt-Mock-up
        </p>
        <div className="relative w-full">
          <Image
            src={mockupUrl}
            alt={alt}
            width={1024}
            height={576}
            className="w-full h-auto block"
            unoptimized
            priority
          />
          <div
            className="absolute overflow-hidden pointer-events-none"
            style={{
              left: `${overlay.left}%`,
              top: `${overlay.top}%`,
              width: `${overlay.width}%`,
              height: `${overlay.height}%`,
              transform: `perspective(600px) rotateX(${cal.rotateX}deg) rotateZ(${cal.rotateZ}deg)`,
              transformOrigin: "center center",
              outline: calibrate ? "1px solid rgba(250, 204, 21, 0.9)" : undefined,
            }}
          >
            {printPreviewUrl || previewLoading ? (
              <PrintPreviewLogoImage
                previewUrl={printPreviewUrl}
                loading={Boolean(previewLoading)}
                alt="Logo auf dem Armband"
                className="block h-full w-full object-contain"
              />
            ) : calibrate ? (
              <div className="h-full w-full bg-sky-400/35 border border-red-500/80" />
            ) : null}
          </div>
        </div>
      </div>

      {calibrate ? (
        <MockupCalibrationEditor produkt={produkt} value={cal} onChange={setCal} />
      ) : null}
    </div>
  )
}
