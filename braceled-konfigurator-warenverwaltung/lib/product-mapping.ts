import { getDb } from "@/lib/db"
import { usesArmbandLager } from "@/lib/konfigurator/product-info"
import {
  isLeuchtgruppeName,
  isTextilbandLeuchtgruppe,
} from "@/lib/konfigurator/leuchtgruppen"
import { cache } from "react"

export { usesArmbandLager }

export type WristlinkProdukt = "armband" | "textilband" | "zauberstab" | "licht"

export const WRISTLINK_PRODUKTE: WristlinkProdukt[] = [
  "armband",
  "textilband",
  "zauberstab",
  "licht",
]

/** Standard-Suchmuster für Gruppennamen je Produktkategorie (Groß/Kleinschreibung ignoriert). */
export const DEFAULT_PRODUCT_PATTERNS: Record<WristlinkProdukt, string[]> = {
  armband: ["armband"],
  textilband: ["textil"],
  zauberstab: ["zauberstab", "stab"],
  licht: ["licht"],
}

export type ProductMappingConfig = Record<WristlinkProdukt, string[]>

function parseMappingJson(raw: string): ProductMappingConfig | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ProductMappingConfig>
    const result = {} as ProductMappingConfig
    for (const produkt of WRISTLINK_PRODUKTE) {
      const patterns = parsed[produkt]
      if (!Array.isArray(patterns) || patterns.length === 0) {
        if (produkt === "textilband") {
          result[produkt] = DEFAULT_PRODUCT_PATTERNS.textilband
          continue
        }
        return null
      }
      result[produkt] = patterns.map(String)
    }
    return result
  } catch {
    return null
  }
}

export function getProductMappingFromEnv(): ProductMappingConfig | null {
  const raw = process.env.WRISTLINK_PRODUCT_MAPPING
  if (!raw) return null
  return parseMappingJson(raw)
}

export async function getProductMappingFromDb(): Promise<ProductMappingConfig | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT value FROM system_settings WHERE key = 'product_mapping' LIMIT 1
  `
  if (!rows.length) return null
  return parseMappingJson(String(rows[0].value))
}

export const getProductMapping = cache(async (): Promise<ProductMappingConfig> => {
  return (
    getProductMappingFromEnv() ??
    (await getProductMappingFromDb()) ??
    DEFAULT_PRODUCT_PATTERNS
  )
})

export function isWristlinkProdukt(value: string): value is WristlinkProdukt {
  return WRISTLINK_PRODUKTE.includes(value as WristlinkProdukt)
}

export function groupMatchesPatterns(groupName: string, patterns: string[]): boolean {
  const normalized = groupName.toLowerCase()
  return patterns.some((pattern) => normalized.includes(pattern.toLowerCase()))
}

/** @deprecated use isLeuchtgruppeName – Alias für bestehende Imports */
export function isArmbandLeuchtgruppe(groupName: string): boolean {
  return isLeuchtgruppeName(groupName)
}

export const resolveGroupsForProduct = cache(async (
  produkt: WristlinkProdukt,
  kanalanzahl?: number,
): Promise<Array<{ id: number; name: string; kanalanzahl: number }>> => {
  const mapping = await getProductMapping()
  const patterns = mapping[produkt]
  const sql = getDb()
  const groups = (await sql`
    SELECT id, name, kanalanzahl FROM groups ORDER BY name ASC
  `) as Array<{ id: number; name: string; kanalanzahl: number }>

  const effectiveKanal =
    produkt === "textilband" ? 40 : kanalanzahl

  return groups
    .filter((group) => {
      if (produkt === "armband" && isLeuchtgruppeName(group.name)) return true
      if (produkt === "textilband" && isTextilbandLeuchtgruppe(group.name)) return true
      return groupMatchesPatterns(group.name, patterns)
    })
    .filter((group) => effectiveKanal == null || group.kanalanzahl === effectiveKanal)
})
