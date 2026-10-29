"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Pencil, AlertCircle } from "lucide-react"
import type { QuoteConfig } from "@/lib/konfigurator/types"
import type { PreisEngineResult } from "@/lib/pricing/types"
import { formatEur } from "@/lib/pricing/preis-engine"
import { displayPositionen, formatPriceSummary } from "@/lib/pricing/display"
import { HOCHZEIT_B2B_NOTICE, PRICING_NOTICE_B2B } from "@/lib/konfigurator/consent"
import { formatKontaktAdresse, isKontaktAdresseComplete } from "@/lib/konfigurator/kontakt-adresse"
import { normalizePlz } from "@/lib/konfigurator/plz"
import { cn } from "@/lib/utils"
import {
  STATION_OPTIONS,
  PRODUCT_OPTIONS,
  SZENARIO_OPTIONS,
  getDruckArtOptions,
  LIEFERLAND_INFO,
  LIEFERLAND_OPTIONS,
  TECHNIKER_CARD_IMAGE,
  GRUPPEN_INFO,
  DRUCK_INFO,
  TEXTILBAND_DRUCK_INFO,
  TEXTILBAND_MAX_GRUPPEN,
  getProbedruckOptions,
  TECHNIKER_INFO,
  TECHNIKER_STEUERPULT_OPTIONS,
  VORPROGRAMMIERT_INFO,
  REPEATER_BASIS_INFO,
  PRODUKT_ANZEIGE,
  getProbedruckLabel,
  normalizeProbedruckOption,
  normalizeDruckArt,
  MIN_MENGE,
  MAX_MENGE,
  MENGE_STEP,
  PRODUCT_UNAVAILABLE_HINT,
  usesArmbandLager,
  type ProbedruckOption,
  type DruckArt,
} from "@/lib/konfigurator/product-info"
import {
  FLEX_RUECKGABE_INFO,
  LIEFERPAKET_OPTIONS,
  applyLieferpaket,
  getLieferpaketLabel,
  getLieferpaketWarning,
  hasAllowedLieferpaket,
  isFlexRueckgabeAllowed,
  isLieferpaketAllowed,
  isTechnikerAllowed,
  normalizeFlexRueckgabe,
  normalizeLieferpaket,
  syncLieferpaketFromEvent,
  getLieferpaketBlockReason,
  workdaysUntilEvent,
  type Lieferpaket,
} from "@/lib/konfigurator/lieferpaket"
import { OptionCard } from "@/components/konfigurator/option-card"
import { StickyPriceBox } from "@/components/konfigurator/sticky-price-box"
import { LogoPreview } from "@/components/konfigurator/logo-preview"
import { AvailabilityIndicator } from "@/components/konfigurator/availability-indicator"
import { StationAvailabilityIndicator } from "@/components/konfigurator/station-availability-indicator"
import { StationComparisonModal, StationInfoModal } from "@/components/konfigurator/station-info-modal"
import type { AvailabilityResponse } from "@/lib/actions/n8n-api"
import { formatAvailabilityStandDatum, daysUntilEvent, SHORT_DELIVERY_WARNING_DAYS } from "@/lib/konfigurator/availability-stress"
import type { StationAvailability } from "@/lib/konfigurator/station-availability"
import type { GroupProgrammingAvailability } from "@/lib/konfigurator/group-allocation"
import {
  normalizeGruppenGroessen,
  syncGruppenGroessen,
  gruppenVerteilungGueltig,
  maxGruppenAnzahl,
  GRUPPEN_MIN,
  GRUPPEN_SLIDER_STEP,
} from "@/lib/konfigurator/gruppen-config"
import { MAX_PHYSICAL_GROUPS } from "@/lib/konfigurator/kanalanzahl"
import { PersonalCallBanner } from "@/components/konfigurator/personal-call-banner"
import { LogisticsTimeline } from "@/components/konfigurator/logistics-timeline"
import { GruppenVerteilungsSlider } from "@/components/konfigurator/gruppen-verteilungs-slider"
import { WristbandMockup } from "@/components/konfigurator/wristband-mockup"
import { readMockupCalibrateFromLocation } from "@/lib/konfigurator/mockup-calibration"

const STEPS = [
  { label: "Event", question: "Was planen Sie?" },
  { label: "Umfang", question: "Wie viele LED-Produkte benötigen Sie?" },
  { label: "Steuerung", question: "Wie sollen die Bänder gesteuert werden?" },
  { label: "Extras", question: "Welche Zusatzleistungen wünschen Sie?" },
  { label: "Angebot", question: "Ihre Zusammenfassung" },
] as const

const LAST_STEP = STEPS.length - 1
/** Preis ab Schritt „Umfang“ (Mengenauswahl) */
const PRICE_VISIBLE_FROM_STEP = 1

const DEFAULT_CONFIG: QuoteConfig = {
  kontaktName: "",
  kontaktFirma: "",
  kontaktTelefon: "",
  kontaktStrasse: "",
  kontaktPlz: "",
  kontaktOrt: "",
  szenario: "corporate",
  variante: "standard",
  produkt: "armband",
  modus: "kauf",
  menge: 300,
  kanalanzahl: 40,
  druck: false,
  druckTextilband: false,
  druckArt: "logo",
  probedruckOption: "none",
  probedruck: false,
  flex: false,
  lieferpaket: "regulaer",
  flexRueckgabe: false,
  lieferart: "standard",
  gruppen: 0,
  baenderProGruppe: 50,
  station: "keine",
  stationModus: "miete",
  lieferzeit: "standard",
  land: "DE",
  techniker: false,
  technikerTage: 1,
  technikerAdresse: "",
  technikerKm: undefined,
  technikerSteuerpult: undefined,
  vorprogrammiertZusenden: false,
  repeaterBasisstation: false,
  gruppenGroessen: [],
}

export function ConfiguratorWizard({
  userEmail,
  initialContact,
  editMode = false,
  editToken,
  initialConfig,
}: {
  userEmail: string
  initialContact?: Pick<QuoteConfig, "kontaktName" | "kontaktFirma" | "kontaktTelefon">
  editMode?: boolean
  editToken?: string
  initialConfig?: QuoteConfig
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [config, setConfig] = useState<QuoteConfig>(
    initialConfig
      ? { ...DEFAULT_CONFIG, ...initialConfig }
      : {
          ...DEFAULT_CONFIG,
          kontaktName: initialContact?.kontaktName || "",
          kontaktFirma: initialContact?.kontaktFirma || "",
          kontaktTelefon: initialContact?.kontaktTelefon || "",
        },
  )
  const [price, setPrice] = useState<PreisEngineResult | null>(null)
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [stationAvailability, setStationAvailability] = useState<StationAvailability | null>(null)
  const [groupAvailability, setGroupAvailability] = useState<GroupProgrammingAvailability | null>(null)
  const [loadingGroupAvailability, setLoadingGroupAvailability] = useState(false)
  const [loadingPrice, setLoadingPrice] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedToken, setSubmittedToken] = useState<string | null>(null)
  const [showFieldErrors, setShowFieldErrors] = useState(false)
  const [distanceLoading, setDistanceLoading] = useState(false)
  const [distanceError, setDistanceError] = useState<string | null>(null)
  const [stationInfoModal, setStationInfoModal] = useState<"eco" | "pro" | null>(null)
  const [stationComparisonOpen, setStationComparisonOpen] = useState(false)
  const [mockupCalibrate, setMockupCalibrate] = useState(false)
  const requestAbortRef = useRef<AbortController | null>(null)
  const distanceDebounceRef = useRef<number | null>(null)

  useEffect(() => {
    setMockupCalibrate(readMockupCalibrateFromLocation())
  }, [])

  useEffect(() => {
    setShowFieldErrors(false)
  }, [step])

  const updateConfig = (patch: Partial<QuoteConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch }
      if (patch.modus === "miete") {
        next.druck = false
        next.druckArt = "logo"
        next.probedruckOption = "none"
        next.probedruck = false
        next.logoId = undefined
      }
      if (patch.produkt && patch.produkt !== "armband") next.variante = "standard"
      if (patch.produkt === "textilband") {
        next.kanalanzahl = 40
        if (next.gruppen > TEXTILBAND_MAX_GRUPPEN) next.gruppen = TEXTILBAND_MAX_GRUPPEN
      }
      if (patch.produkt && patch.produkt !== "textilband") {
        next.druckTextilband = false
      }
      if (patch.station === "pro") next.stationModus = "miete"
      if (patch.station === "pro" && (patch.gruppen === undefined ? prev.gruppen : patch.gruppen) <= 0) {
        next.gruppen = GRUPPEN_MIN
      }
      if (patch.station && patch.station !== "pro") {
        next.gruppen = 0
        next.gruppenGroessen = []
        next.techniker = false
        next.technikerSteuerpult = undefined
        next.vorprogrammiertZusenden = false
        next.repeaterBasisstation = false
      }
      if (patch.techniker === true && next.technikerSteuerpult == null) {
        next.technikerSteuerpult = "vorhanden"
      }
      const syncedGroessen = syncGruppenGroessen(prev, patch)
      if (syncedGroessen !== undefined) {
        next.gruppenGroessen = syncedGroessen
      }
      if (patch.lieferpaket !== undefined) {
        const flexRg =
          patch.lieferpaket === "eil"
            ? false
            : (patch.flexRueckgabe ?? next.flexRueckgabe ?? false)
        Object.assign(next, applyLieferpaket(patch.lieferpaket as Lieferpaket, flexRg))
      }
      if (patch.probedruckOption !== undefined) {
        next.probedruck = patch.probedruckOption !== "none"
      }
      if (patch.flexRueckgabe !== undefined && normalizeLieferpaket(next) !== "eil") {
        Object.assign(
          next,
          applyLieferpaket(normalizeLieferpaket(next), patch.flexRueckgabe),
        )
      }
      if (patch.druck === false) {
        next.probedruckOption = "none"
        next.probedruck = false
        next.logoId = undefined
        next.druckArt = "logo"
      }
      if (patch.druck === true && patch.druckArt === undefined && !next.druckArt) {
        next.druckArt = "logo"
      }
      if (patch.druckArt === "vollflaechig") {
        next.logoId = undefined
        next.probedruckOption = "none"
        next.probedruck = false
      }
      if (patch.gruppen !== undefined && patch.gruppen > 10 && next.produkt !== "textilband") {
        next.kanalanzahl = 80
      }
      if (next.produkt === "textilband") {
        next.kanalanzahl = 40
      }
      if (patch.menge !== undefined || patch.gruppen !== undefined || patch.produkt !== undefined) {
        const menge = patch.menge ?? next.menge
        let maxGruppen = maxGruppenAnzahl(menge)
        if (next.produkt === "textilband") {
          maxGruppen = Math.min(maxGruppen, TEXTILBAND_MAX_GRUPPEN)
        }
        if (next.gruppen > maxGruppen) {
          next.gruppen = maxGruppen
        }
      }
      if (patch.von !== undefined && patch.von) {
        const tage = daysUntilEvent(patch.von)
        const werktage = workdaysUntilEvent(patch.von)
        const lieferPatch = syncLieferpaketFromEvent(next, werktage)
        Object.assign(next, lieferPatch)
        if (!isTechnikerAllowed(tage)) {
          next.techniker = false
          next.technikerSteuerpult = undefined
        }
      }
      if (patch.druck !== undefined || patch.modus !== undefined) {
        const von = patch.von ?? next.von
        if (von) {
          const werktage = workdaysUntilEvent(von)
          const lieferPatch = syncLieferpaketFromEvent(next, werktage)
          Object.assign(next, lieferPatch)
        }
      }
      if (patch.techniker === false) {
        next.technikerTage = 1
        next.technikerSteuerpult = undefined
      }
      return next
    })
  }

  const stationModus = config.station === "pro" ? "miete" : config.stationModus

  async function berechneEntfernung(adresseOverride?: string) {
    const adresse = (adresseOverride ?? config.technikerAdresse)?.trim()
    if (!adresse || adresse.length < 5) {
      if (!adresseOverride) {
        setDistanceError("Bitte Eventadresse eingeben")
      }
      return
    }
    setDistanceLoading(true)
    setDistanceError(null)
    try {
      const res = await fetch("/api/konfigurator/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adresse }),
      })
      const data = await res.json()
      if (!res.ok) {
        setDistanceError(data.error || "Entfernung konnte nicht berechnet werden")
        return
      }
      updateConfig({ technikerKm: data.km, technikerAdresse: data.displayName || adresse })
    } catch {
      setDistanceError("Netzwerkfehler bei Entfernungsberechnung")
    } finally {
      setDistanceLoading(false)
    }
  }

  useEffect(() => {
    const adresse = config.technikerAdresse?.trim()
    if (!adresse || adresse.length < 5) {
      return
    }
    if (distanceDebounceRef.current) {
      window.clearTimeout(distanceDebounceRef.current)
    }
    distanceDebounceRef.current = window.setTimeout(() => {
      void berechneEntfernung(adresse)
    }, 700)
    return () => {
      if (distanceDebounceRef.current) {
        window.clearTimeout(distanceDebounceRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced Entfernung bei Adressänderung
  }, [config.technikerAdresse])

  const fetchPrice = useCallback(async (cfg: QuoteConfig, signal?: AbortSignal) => {
    setLoadingPrice(true)
    try {
      const res = await fetch("/api/konfigurator/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "price", config: cfg }),
        signal,
      })
      if (signal?.aborted) return
      const data = await res.json()
      setPrice(data)
    } catch (error) {
      if ((error as { name?: string })?.name !== "AbortError") {
        throw error
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingPrice(false)
      }
    }
  }, [])

  const fetchAvailability = useCallback(async (cfg: QuoteConfig, signal?: AbortSignal) => {
    if (!cfg.von) {
      setAvailability(null)
      return
    }
    setLoadingAvailability(true)
    try {
      const res = await fetch("/api/konfigurator/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "availability", config: cfg }),
        signal,
      })
      if (signal?.aborted) return
      const data = await res.json()
      setAvailability(data)
    } catch (error) {
      if ((error as { name?: string })?.name !== "AbortError") {
        throw error
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingAvailability(false)
      }
    }
  }, [])

  const fetchStationAvailability = useCallback(async (cfg: QuoteConfig, signal?: AbortSignal) => {
    if (cfg.station === "keine") {
      setStationAvailability(null)
      return
    }
    try {
      const res = await fetch("/api/konfigurator/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "station-availability",
          config: {
            ...cfg,
            stationModus: cfg.station === "pro" ? "miete" : cfg.stationModus,
          },
        }),
        signal,
      })
      if (signal?.aborted) return
      const data = await res.json()
      setStationAvailability(data)
    } catch (error) {
      if ((error as { name?: string })?.name !== "AbortError") {
        throw error
      }
    }
  }, [])

  const fetchGroupAvailability = useCallback(async (cfg: QuoteConfig, signal?: AbortSignal) => {
    if (!cfg.von || cfg.gruppen <= 0 || cfg.station !== "pro") {
      setGroupAvailability(null)
      return
    }
    setLoadingGroupAvailability(true)
    try {
      const res = await fetch("/api/konfigurator/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "group-availability", config: cfg }),
        signal,
      })
      if (signal?.aborted) return
      const data = await res.json()
      setGroupAvailability(data)
    } catch (error) {
      if ((error as { name?: string })?.name !== "AbortError") {
        throw error
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingGroupAvailability(false)
      }
    }
  }, [])

  async function handleLogoUpload(file: File) {
    setLogoUploading(true)
    setLogoError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/konfigurator/logo", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setLogoError(data.error || "Upload fehlgeschlagen")
        return
      }
      if (logoPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreviewUrl)
      }
      updateConfig({ logoId: data.logoId })
      setLogoPreviewUrl(`/api/konfigurator/logo/${data.logoId}`)
    } catch {
      setLogoError("Netzwerkfehler beim Upload")
    } finally {
      setLogoUploading(false)
    }
  }

  useEffect(() => {
    if (!config.von) return
    const tage = daysUntilEvent(config.von)
    const werktage = workdaysUntilEvent(config.von)
    const lieferPatch = syncLieferpaketFromEvent(config, werktage)
    const patch: Partial<QuoteConfig> = { ...lieferPatch }
    if (!isTechnikerAllowed(tage) && config.techniker) {
      patch.techniker = false
    }
    if (Object.keys(patch).length === 0) return
    setConfig((prev) => ({ ...prev, ...patch }))
  }, [config.von, config.lieferpaket, config.flexRueckgabe, config.druck, config.techniker])

  const lieferpaket = normalizeLieferpaket(config)
  const flexRueckgabe = normalizeFlexRueckgabe(config)
  const probedruckOption = normalizeProbedruckOption(config)
  const druckArt = normalizeDruckArt(config)
  const showPrice = step >= PRICE_VISIBLE_FROM_STEP

  useEffect(() => {
    if (config.logoId && !logoPreviewUrl) {
      setLogoPreviewUrl(`/api/konfigurator/logo/${config.logoId}`)
    }
    if (!config.logoId && logoPreviewUrl) {
      setLogoPreviewUrl(null)
    }
  }, [config.logoId, logoPreviewUrl])

  const requestConfig = useMemo<QuoteConfig>(
    () => ({
      ...DEFAULT_CONFIG,
      ...config,
      gruppenGroessen: normalizeGruppenGroessen(config).slice(0, config.gruppen),
    }),
    [
      config.produkt,
      config.modus,
      config.menge,
      config.kanalanzahl,
      config.von,
      config.bis,
      config.station,
      config.stationModus,
      config.variante,
      config.druck,
      config.druckArt,
      config.probedruckOption,
      config.flex,
      config.lieferpaket,
      config.flexRueckgabe,
      config.lieferzeit,
      config.lieferart,
      config.gruppen,
      config.gruppenGroessen,
      config.techniker,
      config.technikerTage,
      config.technikerKm,
    ],
  )

  useEffect(() => {
    requestAbortRef.current?.abort()
    const controller = new AbortController()
    requestAbortRef.current = controller
    const timer = window.setTimeout(() => {
      void fetchPrice(requestConfig, controller.signal)
      void fetchAvailability(requestConfig, controller.signal)
      void fetchStationAvailability(requestConfig, controller.signal)
      void fetchGroupAvailability(requestConfig, controller.signal)
    }, 400)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [
    requestConfig,
    fetchPrice,
    fetchAvailability,
    fetchStationAvailability,
    fetchGroupAvailability,
  ])

  const gruppenGroessen = normalizeGruppenGroessen(config)
  const maxGruppen =
    config.produkt === "textilband"
      ? Math.min(maxGruppenAnzahl(config.menge), TEXTILBAND_MAX_GRUPPEN)
      : maxGruppenAnzahl(config.menge)
  const tageBisEvent = config.von ? daysUntilEvent(config.von) : null
  const werktageBisEvent = config.von ? workdaysUntilEvent(config.von) : null
  const kurzeLieferzeit =
    tageBisEvent !== null && tageBisEvent >= 0 && tageBisEvent < SHORT_DELIVERY_WARNING_DAYS
  const lieferpaketWarning = getLieferpaketWarning(werktageBisEvent)

  const canNext = () => {
    if (step === 0) {
      return (
        Boolean(config.kontaktName?.trim()) &&
        Boolean(config.kontaktFirma?.trim()) &&
        Boolean(config.kontaktTelefon?.trim()) &&
        isKontaktAdresseComplete(config) &&
        Boolean(config.szenario) &&
        Boolean(config.von) &&
        Boolean(config.technikerAdresse?.trim())
      )
    }
    if (step === 1) {
      if (config.menge % MENGE_STEP !== 0) return false
      if (
        config.modus === "kauf" &&
        config.druck &&
        druckArt === "logo" &&
        !config.logoId
      ) {
        return false
      }
      return true
    }
    if (step === 2) {
      if (!config.von) return false
      if (config.station === "pro" && config.gruppen < GRUPPEN_MIN) return false
      if (config.gruppen > 0 && config.station !== "pro") return false
      if (config.station === "pro" && !gruppenVerteilungGueltig(gruppenGroessen, config.menge)) {
        return false
      }
      if (config.techniker) {
        if (!isTechnikerAllowed(tageBisEvent)) return false
        if (!config.technikerTage || config.technikerTage < 1) return false
        if (!config.technikerAdresse?.trim()) return false
        if (config.technikerKm === undefined || config.technikerKm < 0) return false
        if (!config.technikerSteuerpult) return false
      }
      // Band-/Controller-/Gruppen-Ampel blockiert nicht (Warnung bleibt sichtbar).
      return true
    }
    if (step === 3) {
      if (!hasAllowedLieferpaket(werktageBisEvent)) return false
      if (!isLieferpaketAllowed(lieferpaket, werktageBisEvent)) return false
      if (flexRueckgabe && !isFlexRueckgabeAllowed(werktageBisEvent, lieferpaket)) return false
      return true
    }
    return true
  }

  const plzValid = normalizePlz(config.kontaktPlz || "").length === 5
  const step2GruppenInvalid =
    config.station === "pro" && !gruppenVerteilungGueltig(gruppenGroessen, config.menge)
  const step4LieferpaketInvalid =
    !hasAllowedLieferpaket(werktageBisEvent) ||
    !isLieferpaketAllowed(lieferpaket, werktageBisEvent)
  const step2TechnikerInvalid =
    config.techniker &&
    (!config.technikerTage ||
      config.technikerTage < 1 ||
      !config.technikerAdresse?.trim() ||
      config.technikerKm === undefined ||
      config.technikerKm < 0)

  function fieldError(valid: boolean) {
    return showFieldErrors && !valid
  }

  function handleNext() {
    if (!canNext()) {
      setShowFieldErrors(true)
      return
    }
    setShowFieldErrors(false)
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    if (!price || !price.gueltig) {
      setError("Preis konnte nicht berechnet werden")
      return
    }
    if (editMode && !editToken) {
      setError("Bearbeitungs-Token fehlt. Bitte laden Sie die Seite erneut.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      if (editMode && editToken) {
        const res = await fetch(`/api/konfigurator/update/${editToken}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Fehler beim Absenden der Änderung")
          return
        }
        router.push(`/angebot/${editToken}`)
        return
      }
      const res = await fetch("/api/konfigurator/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Fehler beim Absenden")
        return
      }
      setSubmittedToken(data.publicToken)
    } catch {
      setError("Netzwerkfehler")
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedToken) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-6 w-6" />
            Anfrage eingegangen
          </CardTitle>
          <CardDescription>
            Vielen Dank! Wir prüfen Ihr Angebot und melden uns per E-Mail. Für die Statusseite
            geben Sie dort Ihre Firmen-PLZ ein.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <a href={`/angebot/${submittedToken}`}>Anfrage-Status ansehen</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const availabilityStand = availability?.standDatum
    ? formatAvailabilityStandDatum(availability.standDatum)
    : null

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-4">
      <PersonalCallBanner />
      {mockupCalibrate && (
        <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-amber-950">
              Mock-up-Kalibrierung aktiv
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={config.produkt === "armband" ? "default" : "outline"}
                onClick={() => updateConfig({ produkt: "armband" })}
              >
                LED Armband
              </Button>
              <Button
                type="button"
                size="sm"
                variant={config.produkt === "textilband" ? "default" : "outline"}
                onClick={() => updateConfig({ produkt: "textilband" })}
              >
                LED Textilband
              </Button>
            </div>
          </div>
          <p className="text-xs text-amber-900/80">
            Overlay und Slider erscheinen hier direkt – unabhängig vom Wizard-Schritt.
            URL ohne trailing Punkt:{" "}
            <code className="text-[10px]">?mockupCalibrate=1</code>
          </p>
          <WristbandMockup
            printPreviewUrl={logoPreviewUrl}
            forceCalibrate
            produkt={config.produkt}
          />
        </div>
      )}
      {editMode && (
        <Alert className="border-blue-200 bg-blue-50 text-blue-900">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            Du änderst eine bestehende Anfrage. Nach dem Absenden prüfen wir erneut.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm text-muted-foreground">Angemeldet als {userEmail}</p>
        <div className="flex flex-wrap gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground border-primary"
                  : i < step
                    ? "bg-secondary text-secondary-foreground border-transparent cursor-pointer hover:opacity-80"
                    : "bg-transparent text-muted-foreground border-border"
              }`}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6 lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{STEPS[step].question}</CardTitle>
            <CardDescription>
              Schritt {step + 1} von {STEPS.length} · {STEPS[step].label}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Schritt 0: Event-Szenario */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="space-y-4 rounded-lg border p-4">
                  <p className="text-sm font-medium">Ihre Kontaktdaten</p>
                  <p className="text-xs text-muted-foreground">Mit * markierte Felder sind Pflicht.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <RequiredLabel
                        htmlFor="kontakt-name"
                        showError={fieldError(Boolean(config.kontaktName?.trim()))}
                      >
                        Ansprechpartner
                      </RequiredLabel>
                      <Input
                        id="kontakt-name"
                        placeholder="Vor- und Nachname"
                        value={config.kontaktName || ""}
                        onChange={(e) => updateConfig({ kontaktName: e.target.value })}
                        disabled={editMode}
                        className={cn(fieldError(Boolean(config.kontaktName?.trim())) && INVALID_INPUT_CLASS)}
                        aria-invalid={fieldError(Boolean(config.kontaktName?.trim()))}
                      />
                    </div>
                    <div className="space-y-2">
                      <RequiredLabel
                        htmlFor="kontakt-telefon"
                        showError={fieldError(Boolean(config.kontaktTelefon?.trim()))}
                      >
                        Telefon
                      </RequiredLabel>
                      <Input
                        id="kontakt-telefon"
                        type="tel"
                        placeholder="+49 …"
                        value={config.kontaktTelefon || ""}
                        onChange={(e) => updateConfig({ kontaktTelefon: e.target.value })}
                        disabled={editMode}
                        className={cn(fieldError(Boolean(config.kontaktTelefon?.trim())) && INVALID_INPUT_CLASS)}
                        aria-invalid={fieldError(Boolean(config.kontaktTelefon?.trim()))}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <RequiredLabel
                        htmlFor="kontakt-firma"
                        showError={fieldError(Boolean(config.kontaktFirma?.trim()))}
                      >
                        Firma
                      </RequiredLabel>
                      <Input
                        id="kontakt-firma"
                        placeholder="Firmenname"
                        value={config.kontaktFirma || ""}
                        onChange={(e) => updateConfig({ kontaktFirma: e.target.value })}
                        disabled={editMode}
                        className={cn(fieldError(Boolean(config.kontaktFirma?.trim())) && INVALID_INPUT_CLASS)}
                        aria-invalid={fieldError(Boolean(config.kontaktFirma?.trim()))}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <RequiredLabel
                        htmlFor="kontakt-strasse"
                        showError={fieldError(Boolean(config.kontaktStrasse?.trim()))}
                      >
                        Straße und Hausnummer
                      </RequiredLabel>
                      <Input
                        id="kontakt-strasse"
                        placeholder="Musterstraße 12"
                        value={config.kontaktStrasse || ""}
                        onChange={(e) => updateConfig({ kontaktStrasse: e.target.value })}
                        disabled={editMode}
                        className={cn(fieldError(Boolean(config.kontaktStrasse?.trim())) && INVALID_INPUT_CLASS)}
                        aria-invalid={fieldError(Boolean(config.kontaktStrasse?.trim()))}
                      />
                    </div>
                    <div className="space-y-2">
                      <RequiredLabel htmlFor="kontakt-plz" showError={fieldError(plzValid)}>
                        Postleitzahl
                      </RequiredLabel>
                      <Input
                        id="kontakt-plz"
                        inputMode="numeric"
                        pattern="[0-9]{5}"
                        maxLength={5}
                        placeholder="10115"
                        value={config.kontaktPlz || ""}
                        onChange={(e) =>
                          updateConfig({
                            kontaktPlz: e.target.value.replace(/\D/g, "").slice(0, 5),
                          })
                        }
                        disabled={editMode}
                        className={cn(fieldError(plzValid) && INVALID_INPUT_CLASS)}
                        aria-invalid={fieldError(plzValid)}
                      />
                    </div>
                    <div className="space-y-2">
                      <RequiredLabel
                        htmlFor="kontakt-ort"
                        showError={fieldError(Boolean(config.kontaktOrt?.trim()))}
                      >
                        Ort
                      </RequiredLabel>
                      <Input
                        id="kontakt-ort"
                        placeholder="Berlin"
                        value={config.kontaktOrt || ""}
                        onChange={(e) => updateConfig({ kontaktOrt: e.target.value })}
                        disabled={editMode}
                        className={cn(fieldError(Boolean(config.kontaktOrt?.trim())) && INVALID_INPUT_CLASS)}
                        aria-invalid={fieldError(Boolean(config.kontaktOrt?.trim()))}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="kontakt-email">E-Mail</Label>
                      <Input
                        id="kontakt-email"
                        type="email"
                        value={userEmail}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Die Postleitzahl dient als Zugangscode für die Statusseite (Link in unseren
                    E-Mails).
                  </p>
                </div>

                <div className="space-y-2">
                  <SectionLabel required showError={fieldError(Boolean(config.szenario))}>
                    Art der Veranstaltung
                  </SectionLabel>
                <div
                  className={cn(
                    "grid gap-3 sm:grid-cols-2",
                    fieldError(Boolean(config.szenario)) && "rounded-lg ring-2 ring-destructive p-1",
                  )}
                >
                  {SZENARIO_OPTIONS.map((s) => (
                    <OptionCard
                      key={s.value}
                      selected={config.szenario === s.value}
                      disabled={editMode}
                      onClick={() => updateConfig({ szenario: s.value })}
                      title={s.label}
                      description={s.hint}
                    />
                  ))}
                </div>
                </div>

                {config.szenario === "hochzeit" && (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription>{HOCHZEIT_B2B_NOTICE}</AlertDescription>
                  </Alert>
                )}

                <div
                  className={cn(
                    "space-y-4 rounded-lg border p-4",
                    (fieldError(Boolean(config.technikerAdresse?.trim())) ||
                      fieldError(Boolean(config.von))) &&
                      "border-destructive",
                  )}
                >
                  <SectionLabel required>Event-Details</SectionLabel>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <RequiredLabel
                        htmlFor="event-adresse"
                        showError={fieldError(Boolean(config.technikerAdresse?.trim()))}
                      >
                        Eventadresse
                      </RequiredLabel>
                      <Input
                        id="event-adresse"
                        placeholder="Straße, PLZ Ort"
                        value={config.technikerAdresse || ""}
                        onChange={(e) => {
                          setDistanceError(null)
                          updateConfig({
                            technikerAdresse: e.target.value,
                            technikerKm: undefined,
                          })
                        }}
                        className={cn(
                          fieldError(Boolean(config.technikerAdresse?.trim())) && INVALID_INPUT_CLASS,
                        )}
                        aria-invalid={fieldError(Boolean(config.technikerAdresse?.trim()))}
                      />
                      {distanceLoading && (
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Entfernung wird berechnet …
                        </p>
                      )}
                      {config.technikerKm !== undefined && !distanceLoading && (
                        <p className="text-xs text-muted-foreground">
                          ca. {config.technikerKm} km ab Wehrheim
                        </p>
                      )}
                      {distanceError && (
                        <p className="text-xs text-destructive">{distanceError}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <RequiredLabel htmlFor="event-von" showError={fieldError(Boolean(config.von))}>
                        Eventbeginn
                      </RequiredLabel>
                      <Input
                        id="event-von"
                        type="date"
                        value={config.von || ""}
                        onChange={(e) => updateConfig({ von: e.target.value })}
                        disabled={editMode}
                        className={cn(fieldError(Boolean(config.von)) && INVALID_INPUT_CLASS)}
                        aria-invalid={fieldError(Boolean(config.von))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-bis">Eventende</Label>
                      <Input
                        id="event-bis"
                        type="date"
                        value={config.bis || config.von || ""}
                        onChange={(e) => updateConfig({ bis: e.target.value })}
                        disabled={editMode}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Schritt 1: Umfang */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {PRODUCT_OPTIONS.map((p) => (
                    <OptionCard
                      key={p.value}
                      selected={config.produkt === p.value}
                      disabled={editMode || !p.available}
                      onClick={() => updateConfig({ produkt: p.value })}
                      title={p.label}
                      description={p.description}
                      imageSrc={p.imageSrc}
                      imageAlt={p.label}
                      warning={!p.available ? PRODUCT_UNAVAILABLE_HINT : undefined}
                    />
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <OptionCard
                    selected={config.modus === "miete"}
                    disabled={editMode}
                    onClick={() => updateConfig({ modus: "miete" })}
                    title="Miete"
                    description="Für Events mit festem Zeitraum. Rückgabe nach dem Event."
                    badge="Empfohlen für Events"
                  />
                  <OptionCard
                    selected={config.modus === "kauf"}
                    disabled={editMode}
                    onClick={() => updateConfig({ modus: "kauf" })}
                    title="Kauf"
                    description="Eigentum, individueller Logodruck möglich."
                  />
                </div>
                <div className="space-y-3">
                  <Label>Menge: {config.menge} Stück</Label>
                  <Slider
                    min={MIN_MENGE}
                    max={MAX_MENGE}
                    step={MENGE_STEP}
                    value={[config.menge]}
                    onValueChange={([v]) => updateConfig({ menge: v })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {MIN_MENGE.toLocaleString("de-DE")}–{MAX_MENGE.toLocaleString("de-DE")} in{" "}
                    {MENGE_STEP}er-Schritten
                  </p>
                </div>

                {usesArmbandLager(config.produkt) && (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Label>
                            {config.produkt === "textilband"
                              ? "LED-Element bedrucken"
                              : DRUCK_INFO.title}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {config.modus === "miete"
                              ? "Bedruckung des LED-Elements ist nur beim Kauf möglich."
                              : DRUCK_INFO.summary}
                          </p>
                        </div>
                        <Switch
                          checked={config.druck}
                          disabled={config.modus === "miete"}
                          onCheckedChange={(v) => updateConfig({ druck: v })}
                        />
                      </div>

                      {config.modus === "kauf" && (
                        <div className="pt-2 border-t space-y-4">
                          <div className="space-y-3">
                            <Label>Druckart</Label>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {getDruckArtOptions(config.produkt).map((option) => (
                                <OptionCard
                                  key={option.value}
                                  selected={config.druck && druckArt === option.value}
                                  onClick={() =>
                                    updateConfig({
                                      druck: true,
                                      druckArt: option.value as DruckArt,
                                    })
                                  }
                                  title={option.label}
                                  description={option.description}
                                  priceHint={option.priceHint}
                                  imageSrc={option.imageSrc}
                                  imageAlt={option.label}
                                />
                              ))}
                            </div>
                          </div>

                          {config.druck && druckArt === "logo" && (
                            <div
                              className={cn(
                                fieldError(Boolean(config.logoId)) &&
                                  "rounded-lg ring-2 ring-destructive p-2",
                              )}
                            >
                              <RequiredLabel showError={fieldError(Boolean(config.logoId))}>
                                Logo hochladen
                              </RequiredLabel>
                              <LogoPreview
                                logoUrl={logoPreviewUrl}
                                onFileSelect={handleLogoUpload}
                                uploading={logoUploading}
                                uploadError={logoError}
                                produkt={config.produkt}
                                onBrowseRequest={() =>
                                  updateConfig({ druck: true, druckArt: "logo" })
                                }
                              />
                              {fieldError(Boolean(config.logoId)) && (
                                <p className="text-xs text-destructive mt-2">
                                  Bitte laden Sie Ihr Logo hoch.
                                </p>
                              )}
                            </div>
                          )}

                          {config.druck && druckArt === "vollflaechig" && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Vollflächiger Druck ohne Logo-Konfigurator – Motiv und Freigabe klären
                              wir nach Ihrer Anfrage.
                            </p>
                          )}

                          {config.druck && druckArt === "logo" && (
                            <div className="space-y-3">
                              <Label>Probedruck (optional)</Label>
                              <div className="grid gap-3 sm:grid-cols-3">
                                {getProbedruckOptions(config.produkt).map((option) => (
                                  <OptionCard
                                    key={option.value}
                                    selected={probedruckOption === option.value}
                                    onClick={() =>
                                      updateConfig({
                                        probedruckOption: option.value as ProbedruckOption,
                                      })
                                    }
                                    title={option.label}
                                    description={option.description}
                                    imageSrc={option.imageSrc}
                                    imageAlt={option.label}
                                    priceHint={
                                      option.preisNetto > 0
                                        ? `+${formatEur(option.preisNetto)} netto`
                                        : "Kein Aufpreis"
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {config.produkt === "textilband" && (
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <Label>{TEXTILBAND_DRUCK_INFO.title}</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              {TEXTILBAND_DRUCK_INFO.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatEur(TEXTILBAND_DRUCK_INFO.preisBis250)}/Stk. bis 250 ·{" "}
                              {formatEur(TEXTILBAND_DRUCK_INFO.preisAb251)}/Stk. darüber
                            </p>
                          </div>
                          <Switch
                            checked={Boolean(config.druckTextilband)}
                            onCheckedChange={(v) => updateConfig({ druckTextilband: v })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 rounded-lg border p-4">
                  <Label>
                    Verfügbarkeit{" "}
                    {config.produkt === "textilband" ? "LED-Textilarmband" : "LED-Bänder"}
                  </Label>
                  <div className="min-h-[300px]">
                    <AvailabilityIndicator
                      availability={availability}
                      loading={loadingAvailability}
                      hideDetails={editMode}
                      produkt={config.produkt}
                    />
                    {!loadingAvailability && !availability && config.von && (
                      <p className="text-sm text-muted-foreground py-2">
                        Verfügbarkeit wird geladen …
                      </p>
                    )}
                    {!config.von && (
                      <p className="text-sm text-muted-foreground py-2">
                        Eventdatum fehlt – bitte im Schritt Event nachtragen.
                      </p>
                    )}
                    <div className="min-h-[88px] mt-3">
                      {!availability?.verfuegbar && availability ? (
                        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                          Für Deinen Termin sind laut Lagerbestand nicht genug LED-Bänder verfügbar. Wir
                          prüfen natürlich trotzdem, ob wir Dir helfen können – eventuell kommt in der
                          Zwischenzeit noch eine Lieferung oder wir bekommen Refurbished-Bänder zurück
                          ins Lager.
                        </p>
                      ) : null}
                    </div>
                    <div className="min-h-[72px]">
                      {kurzeLieferzeit ? (
                        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <AlertDescription>
                            Achtung: Noch {tageBisEvent} Tag{tageBisEvent === 1 ? "" : "e"} bis zum
                            Event. Wir müssen prüfen, ob eine Lieferung in der kurzen Zeit möglich ist.
                          </AlertDescription>
                        </Alert>
                      ) : null}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Schritt 2: Steuerung */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Basis-Station / Fernsteuerung</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 shrink-0 text-xs"
                      onClick={() => setStationComparisonOpen(true)}
                    >
                      ECO vs. PRO vergleichen
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {STATION_OPTIONS.map((s) => (
                      <OptionCard
                        key={s.value}
                        className={s.value === "keine" ? "sm:col-span-2" : undefined}
                        selected={config.station === s.value}
                        disabled={editMode}
                        onClick={() =>
                          updateConfig({
                            station: s.value,
                            stationModus:
                              s.value === "pro" ? "miete" : config.stationModus || config.modus,
                          })
                        }
                        title={s.label}
                        description={s.description}
                        imageSrc={s.imageSrc}
                        imageAlt={s.label}
                        onInfoClick={
                          s.value === "eco" || s.value === "pro"
                            ? () => setStationInfoModal(s.value)
                            : undefined
                        }
                        priceHint={
                          s.value !== "keine"
                            ? `ab ${s.value === "pro" ? "649" : stationModus === "kauf" ? "399" : "250"} EUR netto`
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>

                {(config.station === "eco" || config.station === "pro") && (
                  <div className="space-y-2">
                    <Label>
                      {config.station === "eco" ? "ECO Handcontroller" : "PRO Basis-Station"}:
                      Kaufen oder Mieten?
                    </Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <OptionCard
                        selected={stationModus === "kauf"}
                        onClick={() => updateConfig({ stationModus: "kauf" })}
                        title="Kaufen"
                        description={
                          config.station === "pro"
                            ? "Nicht verfügbar – PRO nur zur Miete"
                            : "Unabhängig vom Produktmodus"
                        }
                        priceHint={config.station === "eco" ? "399 EUR netto" : undefined}
                        disabled={editMode || config.station === "pro"}
                      />
                      <OptionCard
                        selected={stationModus === "miete"}
                        onClick={() => updateConfig({ stationModus: "miete" })}
                        title="Mieten"
                        description="Unabhängig vom Produktmodus"
                        priceHint={
                          config.station === "pro" ? "649 EUR netto" : "250 EUR netto"
                        }
                        disabled={editMode}
                      />
                    </div>
                  </div>
                )}

                {(config.station === "eco" || config.station === "pro") && (
                  <div className="space-y-3">
                    <StationAvailabilityIndicator
                      station={config.station}
                      availability={stationAvailability}
                    />
                    {stationAvailability && !stationAvailability.verfuegbar && (
                      <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                        Für Deinen Termin ist laut Lagerbestand die gewählte Basis/Fernsteuerung
                        voraussichtlich nicht verfügbar. Wir prüfen natürlich trotzdem, ob wir Dir
                        helfen können.
                      </p>
                    )}
                  </div>
                )}

                {config.station === "pro" && (
                  <div
                    className={cn(
                      "space-y-4 rounded-lg border p-4",
                      showFieldErrors && step2GruppenInvalid && "border-destructive ring-2 ring-destructive",
                    )}
                  >
                    <div className="space-y-3">
                      <Label>
                        {GRUPPEN_INFO.title}: {config.gruppen} Gruppe{config.gruppen === 1 ? "" : "n"}
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {GRUPPEN_INFO.description}
                      </p>
                      <Slider
                        min={GRUPPEN_MIN}
                        max={maxGruppen}
                        step={1}
                        value={[Math.min(config.gruppen, maxGruppen)]}
                        onValueChange={([v]) => updateConfig({ gruppen: v })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Je Gruppe {GRUPPEN_INFO.preisProGruppeNetto} EUR netto · max.{" "}
                        {MAX_PHYSICAL_GROUPS} physische Lagergruppen pro Gruppe
                        {maxGruppen < 20
                          ? ` · bei ${config.menge} Bändern max. ${maxGruppen} Gruppen (je min. ${GRUPPEN_SLIDER_STEP} Stück)`
                          : ""}
                      </p>
                    </div>

                    {config.gruppen > 0 && (
                      <div className="space-y-4 pt-2 border-t">
                        <GruppenVerteilungsSlider
                          menge={config.menge}
                          groessen={gruppenGroessen}
                          onChange={(next) => updateConfig({ gruppenGroessen: next })}
                        />

                        <div className="min-h-[160px]">
                          {loadingGroupAvailability ? (
                            <div className="flex h-full min-h-[140px] items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Gruppen-Verfügbarkeit wird geprüft …
                            </div>
                          ) : groupAvailability ? (
                            <div className="rounded-md border p-3 space-y-2">
                              {groupAvailability.verfuegbar ? (
                                <p className="text-sm text-green-700 font-medium">
                                  Gruppenprogrammierung voraussichtlich möglich
                                  {groupAvailability.physischeGruppen > 0 &&
                                    ` (über ${groupAvailability.physischeGruppen} physische Lagergruppe${groupAvailability.physischeGruppen === 1 ? "" : "n"})`}
                                </p>
                              ) : (
                                <p className="text-sm text-destructive font-medium rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                                  Gruppenprogrammierung voraussichtlich nicht vollständig möglich. Wir
                                  prüfen natürlich trotzdem, ob wir Dir helfen können.
                                </p>
                              )}
                              {groupAvailability.hinweis && (
                                <p className="text-xs text-muted-foreground">{groupAvailability.hinweis}</p>
                              )}
                              {groupAvailability.slots.map((slot) => (
                                <p
                                  key={slot.slot}
                                  className={`text-xs ${
                                    groupAvailability.fehlendeSlots.includes(slot.slot)
                                      ? "text-destructive"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  Gruppe {slot.slot}:{" "}
                                  {groupAvailability.fehlendeSlots.includes(slot.slot)
                                    ? "Bestand im Zeitraum nicht ausreichend"
                                    : "voraussichtlich abdeckbar"}
                                </p>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {config.station === "pro" && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base">PRO-Zusatzoptionen</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Optionen sind einzeln anklickbar und kombinierbar.
                      </p>
                    </div>

                    <div className="grid items-stretch gap-4 lg:grid-cols-2">
                      <OptionCard
                        selected={Boolean(config.techniker)}
                        disabled={!isTechnikerAllowed(tageBisEvent)}
                        onClick={() => {
                          if (!isTechnikerAllowed(tageBisEvent)) return
                          updateConfig({ techniker: !config.techniker })
                        }}
                        title={TECHNIKER_INFO.title}
                        description={
                          !isTechnikerAllowed(tageBisEvent)
                            ? `Nicht buchbar: weniger als ${TECHNIKER_INFO.minVorlaufTage} Tage Vorlauf.`
                            : `${TECHNIKER_INFO.description} Ab ${TECHNIKER_INFO.minVorlaufTage} Tagen Vorlauf.`
                        }
                        imageSrc={TECHNIKER_CARD_IMAGE}
                        imageAlt={TECHNIKER_INFO.title}
                        priceHint={`${formatEur(TECHNIKER_INFO.reiseNetto)} Reise · ${formatEur(TECHNIKER_INFO.tagNetto)}/Tag`}
                      />
                      <OptionCard
                        selected={Boolean(config.vorprogrammiertZusenden)}
                        onClick={() =>
                          updateConfig({
                            vorprogrammiertZusenden: !config.vorprogrammiertZusenden,
                          })
                        }
                        title={VORPROGRAMMIERT_INFO.title}
                        description={VORPROGRAMMIERT_INFO.description}
                        imageSrc={VORPROGRAMMIERT_INFO.imageSrc}
                        imageAlt={VORPROGRAMMIERT_INFO.title}
                        priceHint={`${formatEur(VORPROGRAMMIERT_INFO.preisNetto)} inkl. 1 Korrekturschleife; Video vorab`}
                      />
                    </div>

                    {config.techniker && (
                      <div
                        className={cn(
                          "space-y-3 rounded-lg border p-4",
                          showFieldErrors &&
                            step2TechnikerInvalid &&
                            "ring-2 ring-destructive",
                        )}
                      >
                        <div className="space-y-2">
                          <Label>Steuerpult</Label>
                          <div className="grid items-stretch gap-2 sm:grid-cols-2">
                            {TECHNIKER_STEUERPULT_OPTIONS.map((opt) => (
                              <OptionCard
                                key={opt.value}
                                selected={config.technikerSteuerpult === opt.value}
                                onClick={() =>
                                  updateConfig({ technikerSteuerpult: opt.value })
                                }
                                title={opt.label}
                                description={opt.description}
                                priceHint={
                                  opt.preisNetto > 0
                                    ? `${formatEur(opt.preisNetto)} netto`
                                    : "+0,00 € netto"
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <RequiredLabel
                            htmlFor="techniker-tage"
                            showError={fieldError(
                              Boolean(config.technikerTage && config.technikerTage >= 1),
                            )}
                          >
                            Einsatztage
                          </RequiredLabel>
                          <Input
                            id="techniker-tage"
                            type="number"
                            min={1}
                            max={14}
                            value={config.technikerTage ?? 1}
                            onChange={(e) =>
                              updateConfig({ technikerTage: Number(e.target.value) })
                            }
                            className={cn(
                              fieldError(
                                Boolean(config.technikerTage && config.technikerTage >= 1),
                              ) && INVALID_INPUT_CLASS,
                            )}
                          />
                        </div>
                        {config.technikerKm === undefined ? (
                          <div className="space-y-2">
                            <RequiredLabel
                              htmlFor="techniker-event-adresse"
                              showError={fieldError(Boolean(config.technikerAdresse?.trim()))}
                            >
                              Eventadresse
                            </RequiredLabel>
                            <Input
                              id="techniker-event-adresse"
                              placeholder="Straße, PLZ Ort"
                              value={config.technikerAdresse || ""}
                              onChange={(e) => {
                                setDistanceError(null)
                                updateConfig({
                                  technikerAdresse: e.target.value,
                                  technikerKm: undefined,
                                })
                              }}
                              className={cn(
                                fieldError(Boolean(config.technikerAdresse?.trim())) &&
                                  INVALID_INPUT_CLASS,
                              )}
                            />
                            {distanceLoading && (
                              <p className="text-xs text-muted-foreground flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Entfernung wird berechnet …
                              </p>
                            )}
                            {distanceError && (
                              <p className="text-xs text-destructive">{distanceError}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Eventort: {config.technikerAdresse}
                            {" · "}
                            ca. {config.technikerKm} km (
                            {formatEur(config.technikerKm * TECHNIKER_INFO.kmNetto)} netto)
                            <Button
                              type="button"
                              variant="link"
                              className="h-auto p-0 ml-1 text-xs"
                              onClick={() => {
                                setDistanceError(null)
                                updateConfig({ technikerKm: undefined })
                              }}
                            >
                              ändern
                            </Button>
                          </p>
                        )}
                      </div>
                    )}

                    <OptionCard
                      selected={Boolean(config.repeaterBasisstation)}
                      onClick={() =>
                        updateConfig({
                          repeaterBasisstation: !config.repeaterBasisstation,
                        })
                      }
                      title={REPEATER_BASIS_INFO.title}
                      description={REPEATER_BASIS_INFO.description}
                    />
                    {config.repeaterBasisstation && (
                      <p className="text-sm font-semibold text-foreground">
                        {REPEATER_BASIS_INFO.boldHinweis}
                      </p>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* Schritt 3: Extras */}
            {step === 3 && (
              <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden">
                <div className="space-y-3">
                  <Label>{LIEFERLAND_INFO.title}</Label>
                  <p className="text-xs text-muted-foreground">{LIEFERLAND_INFO.hinweis}</p>
                  <div className="grid items-stretch gap-3 sm:grid-cols-2">
                    {LIEFERLAND_OPTIONS.map((opt) => (
                      <OptionCard
                        key={opt.value}
                        selected={config.land === opt.value}
                        onClick={() => updateConfig({ land: opt.value })}
                        title={opt.label}
                        description={opt.hinweis}
                        priceHint={
                          opt.nachAbsprache
                            ? "nach Absprache"
                            : `+${formatEur(opt.preisNetto)} netto`
                        }
                      />
                    ))}
                  </div>
                </div>

                <div
                  className={cn(
                    "space-y-4 rounded-xl border bg-card p-4",
                    showFieldErrors &&
                      step4LieferpaketInvalid &&
                      "ring-2 ring-destructive",
                  )}
                >
                  <div className="space-y-1">
                    <SectionLabel required showError={showFieldErrors && step4LieferpaketInvalid}>
                      Produktion, Lieferung &amp; Logistik
                    </SectionLabel>
                    {lieferpaketWarning && (
                      <p className="text-xs text-amber-700">{lieferpaketWarning}</p>
                    )}
                    {!hasAllowedLieferpaket(werktageBisEvent) && (
                      <p className="text-xs text-destructive">
                        Mit dem gewählten Eventtermin ist kein Lieferpaket mehr möglich (mindestens
                        48 Stunden Vorlauf erforderlich). Bitte wählen Sie einen späteren Termin.
                      </p>
                    )}
                  </div>

                  <div className="grid items-stretch gap-3 sm:grid-cols-1 md:grid-cols-3">
                    {LIEFERPAKET_OPTIONS.map((p) => {
                      const allowed = isLieferpaketAllowed(p.value, werktageBisEvent)
                      const blockReason = getLieferpaketBlockReason(p.value, werktageBisEvent)
                      return (
                        <OptionCard
                          key={p.value}
                          selected={lieferpaket === p.value}
                          disabled={!allowed}
                          onClick={() => updateConfig({ lieferpaket: p.value })}
                          title={p.label}
                          badge={p.badge}
                          description={p.shortDescription}
                          warning={!allowed ? (blockReason ?? undefined) : undefined}
                          priceHint={
                            p.preisNetto > 0
                              ? `+${formatEur(p.preisNetto)} netto`
                              : "kein Aufpreis"
                          }
                        />
                      )
                    })}
                  </div>

                  <LogisticsTimeline config={config} />

                  {lieferpaket !== "eil" && (
                    <div className="rounded-lg border bg-background/80 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <Label>{FLEX_RUECKGABE_INFO.label}</Label>
                          <p className="text-xs text-muted-foreground">
                            {FLEX_RUECKGABE_INFO.description}
                          </p>
                          {!isFlexRueckgabeAllowed(werktageBisEvent, lieferpaket) && (
                            <p className="text-xs text-amber-700">
                              Bei nur noch {werktageBisEvent} Werktag
                              {werktageBisEvent === 1 ? "" : "en"} bis zum Event nicht verfügbar.
                            </p>
                          )}
                        </div>
                        <Switch
                          checked={flexRueckgabe}
                          disabled={!isFlexRueckgabeAllowed(werktageBisEvent, lieferpaket)}
                          onCheckedChange={(v) => updateConfig({ flexRueckgabe: v })}
                        />
                      </div>
                      <p className="text-xs font-medium text-foreground mt-2">
                        +{formatEur(FLEX_RUECKGABE_INFO.preisNetto)} netto
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Schritt 5: Zusammenfassung */}
            {step === LAST_STEP && (
              <div className="space-y-4">
                <SummaryRow
                  label="Kontakt"
                  value={[
                    config.kontaktName,
                    config.kontaktFirma,
                    formatKontaktAdresse(config) || null,
                    config.kontaktTelefon,
                    userEmail,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  onEdit={() => setStep(0)}
                />
                <SummaryRow
                  label="Event"
                  value={[
                    SZENARIO_OPTIONS.find((s) => s.value === config.szenario)?.label,
                    config.von
                      ? `${config.von}${config.bis && config.bis !== config.von ? ` – ${config.bis}` : ""}`
                      : null,
                    config.technikerAdresse || null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  onEdit={() => setStep(0)}
                />
                <SummaryRow
                  label="Produkt"
                  value={[
                    `${PRODUCT_OPTIONS.find((p) => p.value === config.produkt)?.label} · ${config.modus} · ${config.menge} Stk.`,
                    config.druck
                      ? druckArt === "vollflaechig"
                        ? "LED vollflächig bedruckt"
                        : "LED mit Logo-Bedruckung"
                      : null,
                    config.druckTextilband ? "Textilband bedruckt" : null,
                    config.logoId ? "Logo hochgeladen" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  onEdit={() => setStep(1)}
                />
                {config.von && (
                  <SummaryRow
                    label="Verfügbarkeit"
                    value={
                      availability?.verfuegbar
                        ? `Voraussichtlich verfügbar${availability.langfristig ? " · ausreichend Vorlauf" : ""}`
                        : availability
                          ? "Voraussichtlich nicht verfügbar"
                          : "Wird geprüft"
                    }
                    onEdit={() => setStep(1)}
                  />
                )}
                <SummaryRow
                  label="Steuerung"
                  value={[
                    config.station !== "keine"
                      ? `${config.station} (${stationModus})`
                      : "Nur Knopfsteuerung",
                    config.gruppen > 0
                      ? `${config.gruppen} Gruppe${config.gruppen === 1 ? "" : "n"} (${gruppenGroessen.map((n, i) => `G${i + 1}: ${n}`).join(", ")})`
                      : `${config.gruppen} Gruppen`,
                    config.station !== "keine" && stationAvailability
                      ? stationAvailability.verfuegbar
                        ? "Controller voraussichtlich verfügbar"
                        : "Controller voraussichtlich nicht verfügbar"
                      : null,
                    config.techniker ? `Techniker ${config.technikerTage}d` : null,
                    config.technikerSteuerpult === "mitbuchen"
                      ? "Licht-Steuerpult für LED Armbänder"
                      : config.technikerSteuerpult === "vorhanden"
                        ? "Licht-Steuerpult vorhanden"
                        : null,
                    config.vorprogrammiertZusenden ? "Szenen vorprogrammieren" : null,
                    config.repeaterBasisstation ? "Repeater / Reichweite (Info)" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  onEdit={() => setStep(2)}
                />
                <SummaryRow
                  label="Extras"
                  value={[
                    LIEFERLAND_OPTIONS.find((o) => o.value === config.land)?.label ||
                      config.land,
                    config.druck
                      ? druckArt === "vollflaechig"
                        ? "Vollflächiger Druck"
                        : "Logo-Bedruckung"
                      : null,
                    config.druckTextilband ? "Textilband-Bedruckung" : null,
                    getProbedruckLabel(probedruckOption),
                    getLieferpaketLabel(lieferpaket),
                    flexRueckgabe ? "Flex-Rückgabe" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  onEdit={() => setStep(3)}
                />

                {loadingPrice ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : price?.gueltig ? (
                  <div className="rounded-lg border p-4 space-y-2 lg:hidden">
                    <p className="text-xs text-muted-foreground mb-2">{PRICING_NOTICE_B2B}</p>
                    {displayPositionen(price.positionen).map((p, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{p.pos}</span>
                        <span>{formatEur(p.summe)} netto</span>
                      </div>
                    ))}
                    {(() => {
                      const summary = formatPriceSummary(price)
                      return (
                        <div className="border-t pt-2 space-y-1 font-medium">
                          <div className="flex justify-between text-sm">
                            <span>Gesamt netto</span>
                            <span>{summary.nettoLabel}</span>
                          </div>
                          <div className="flex justify-between text-lg">
                            <span>Zahlungsbetrag</span>
                            <span>{summary.bruttoLabel}</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                ) : price && !price.gueltig ? (
                  <Alert variant="destructive">
                    <AlertDescription>{price.fehler.join("; ")}</AlertDescription>
                  </Alert>
                ) : null}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={submitting || !price?.gueltig}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editMode ? (
                    "Änderung absenden"
                  ) : (
                    "Unverbindlich anfragen"
                  )}
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Zurück
              </Button>
              {step < LAST_STEP ? (
                <Button onClick={handleNext}>
                  Weiter <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : null}
            </div>
            {showFieldErrors && !canNext() && (
              <p className="text-sm text-destructive text-right">
                Bitte füllen Sie alle Pflichtfelder aus (mit * markiert).
              </p>
            )}
          </CardContent>
        </Card>

        <div className="hidden lg:block">
          <StickyPriceBox
            price={price}
            loading={loadingPrice}
            availabilityStand={availabilityStand}
            showPrice={showPrice}
            menge={config.menge}
            produktLabel={PRODUKT_ANZEIGE[config.produkt] ?? config.produkt}
            eventDatum={config.von || null}
          />
        </div>
      </div>

      <div className="lg:hidden">
        <StickyPriceBox
          price={price}
          loading={loadingPrice}
          compact
          availabilityStand={availabilityStand}
          showPrice={showPrice}
          menge={config.menge}
          produktLabel={PRODUKT_ANZEIGE[config.produkt] ?? config.produkt}
          eventDatum={config.von || null}
        />
      </div>

      <StationInfoModal
        station={stationInfoModal}
        open={stationInfoModal !== null}
        onOpenChange={(open) => {
          if (!open) setStationInfoModal(null)
        }}
      />
      <StationComparisonModal
        open={stationComparisonOpen}
        onOpenChange={setStationComparisonOpen}
      />
    </div>
  )
}

function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string
  value: string
  onEdit: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium mt-0.5">{value}</p>
      </div>
      <Button type="button" variant="ghost" size="sm" className="shrink-0 h-8" onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5 mr-1" />
        Ändern
      </Button>
    </div>
  )
}

const INVALID_INPUT_CLASS = "border-destructive focus-visible:ring-destructive"

function RequiredLabel({
  htmlFor,
  children,
  showError,
}: {
  htmlFor?: string
  children: React.ReactNode
  showError?: boolean
}) {
  return (
    <Label htmlFor={htmlFor} className={showError ? "text-destructive" : undefined}>
      {children}
      <span className="text-destructive ml-0.5" aria-hidden="true">
        *
      </span>
    </Label>
  )
}

function SectionLabel({
  children,
  required,
  showError,
}: {
  children: React.ReactNode
  required?: boolean
  showError?: boolean
}) {
  return (
    <p className={cn("text-sm font-medium", showError && "text-destructive")}>
      {children}
      {required && (
        <span className="text-destructive ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </p>
  )
}
