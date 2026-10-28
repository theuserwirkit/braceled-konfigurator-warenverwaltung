"use client"

import Image from "next/image"
import { PrintPreviewLogoImage } from "@/components/konfigurator/print-preview-logo"
import { getWristbandMockupUrl } from "@/lib/konfigurator/product-info"
import {
  getPrintCalibrationForProdukt,
  getPrintOverlayRect,
} from "@/lib/konfigurator/mockup-calibration"

export function WristbandMockup({
  printPreviewUrl,
  previewLoading,
  produkt = "armband",
}: {
  printPreviewUrl: string | null
  previewLoading?: boolean
  produkt?: string
}) {
  const mockupUrl = getWristbandMockupUrl(produkt)
  const cal = getPrintCalibrationForProdukt(produkt)
  const overlay = getPrintOverlayRect(cal)
  const alt =
    produkt === "textilband" ? "LED Textilarmband" : "LED Armband"

  return (
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
          }}
        >
          {printPreviewUrl || previewLoading ? (
            <PrintPreviewLogoImage
              previewUrl={printPreviewUrl}
              loading={Boolean(previewLoading)}
              alt="Logo auf dem Armband"
              className="block h-full w-full object-contain"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
