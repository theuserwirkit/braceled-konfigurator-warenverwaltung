export type WristbandPrintCalibration = {
  left: number
  top: number
  /** Breite der Druckfläche in % der Mock-up-Bildbreite */
  width: number
  /** Höhe der Druckfläche in % der Mock-up-Bildhöhe */
  height: number
  rotateX: number
  rotateZ: number
}

/** Seitenverhältnis des Mock-up-Fotos (ledband-mockup-web.png) */
export const WRISTBAND_MOCKUP_IMAGE_ASPECT = 1024 / 576

/** Reale Druckfläche 3 × 2 cm (Breite × Höhe) – Referenz für Druckfreigabe */
export const WRISTBAND_PRINT_AREA_ASPECT = 3 / 2

export const DEFAULT_WRISTBAND_PRINT_CALIBRATION: WristbandPrintCalibration = {
  left: 37,
  top: 46.25,
  width: 17,
  height: 23.5,
  rotateX: 0,
  rotateZ: 0,
}

/** Druckfläche auf dem LED-Gehäuse des Textilarmband-Mock-ups */
export const TEXTILBAND_PRINT_CALIBRATION: WristbandPrintCalibration = {
  left: 42.75,
  top: 47.75,
  width: 18,
  height: 18,
  rotateX: -6,
  rotateZ: 1,
}

export function getPrintCalibrationForProdukt(produkt: string): WristbandPrintCalibration {
  return produkt === "textilband"
    ? TEXTILBAND_PRINT_CALIBRATION
    : DEFAULT_WRISTBAND_PRINT_CALIBRATION
}

export function getPrintOverlayRect(cal: WristbandPrintCalibration) {
  return {
    left: cal.left,
    top: cal.top,
    width: cal.width,
    height: cal.height,
  }
}

export const WRISTBAND_CALIBRATION_STORAGE_KEY = "wristlink-mockup-calibration"

/** Query `?mockupCalibrate=1` (toleriert Tippfehler wie trailing `.`) */
export function isMockupCalibrateParam(raw: string | null | undefined): boolean {
  if (!raw) return false
  const normalized = raw.trim().replace(/[.,;]+$/g, "").toLowerCase()
  return normalized === "1" || normalized === "true" || normalized === "yes"
}

export function readMockupCalibrateFromLocation(
  search = typeof window !== "undefined" ? window.location.search : "",
): boolean {
  try {
    return isMockupCalibrateParam(new URLSearchParams(search).get("mockupCalibrate"))
  } catch {
    return false
  }
}

export function calibrationStorageKey(produkt: string): string {
  return `${WRISTBAND_CALIBRATION_STORAGE_KEY}:${produkt || "armband"}`
}

export function loadWristbandCalibration(produkt = "armband"): WristbandPrintCalibration {
  const defaults = getPrintCalibrationForProdukt(produkt)
  if (typeof window === "undefined") return defaults
  try {
    const raw = sessionStorage.getItem(calibrationStorageKey(produkt))
    if (!raw) return defaults
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

export function saveWristbandCalibration(
  cal: WristbandPrintCalibration,
  produkt = "armband",
) {
  sessionStorage.setItem(calibrationStorageKey(produkt), JSON.stringify(cal))
}

export function clearWristbandCalibration(produkt = "armband") {
  sessionStorage.removeItem(calibrationStorageKey(produkt))
}

export function formatCalibrationForCopy(cal: WristbandPrintCalibration): string {
  return `left: ${cal.left}, top: ${cal.top}, width: ${cal.width}, height: ${cal.height}, rotateX: ${cal.rotateX}, rotateZ: ${cal.rotateZ}`
}
