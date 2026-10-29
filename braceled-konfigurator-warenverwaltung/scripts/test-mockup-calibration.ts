import {
  DEFAULT_WRISTBAND_PRINT_CALIBRATION,
  TEXTILBAND_PRINT_CALIBRATION,
  formatCalibrationForCopy,
  getPrintCalibrationForProdukt,
  getPrintOverlayRect,
  isMockupCalibrateParam,
} from "../lib/konfigurator/mockup-calibration"

let failed = 0
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL", msg)
    failed++
  } else {
    console.log("OK", msg)
  }
}

assert(
  getPrintCalibrationForProdukt("armband") === DEFAULT_WRISTBAND_PRINT_CALIBRATION,
  "armband uses default calibration",
)
assert(
  getPrintCalibrationForProdukt("textilband") === TEXTILBAND_PRINT_CALIBRATION,
  "textilband uses textilband calibration",
)

const textil = TEXTILBAND_PRINT_CALIBRATION
assert(textil.left === 42.75, `textilband left (got ${textil.left})`)
assert(textil.top === 47.75, `textilband top (got ${textil.top})`)
assert(textil.width === 18, `textilband width (got ${textil.width})`)
assert(textil.height === 18, `textilband height (got ${textil.height})`)
assert(textil.rotateX === -6, `textilband rotateX (got ${textil.rotateX})`)
assert(textil.rotateZ === 1, `textilband rotateZ (got ${textil.rotateZ})`)

const rect = getPrintOverlayRect(textil)
assert(rect.left === textil.left && rect.width === textil.width, "overlay rect mirrors calibration")

const copy = formatCalibrationForCopy(textil)
assert(copy.includes(`left: ${textil.left}`), "copy string includes left")
assert(copy.includes(`rotateZ: ${textil.rotateZ}`), "copy string includes rotateZ")

assert(isMockupCalibrateParam("1") === true, "calibrate param 1")
assert(isMockupCalibrateParam("1.") === true, "calibrate param tolerates trailing dot")
assert(isMockupCalibrateParam("true") === true, "calibrate param true")
assert(isMockupCalibrateParam("0") === false, "calibrate param 0 off")
assert(isMockupCalibrateParam(null) === false, "calibrate param null off")

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`)
  process.exit(1)
}
console.log("\nAll mockup-calibration checks passed")
