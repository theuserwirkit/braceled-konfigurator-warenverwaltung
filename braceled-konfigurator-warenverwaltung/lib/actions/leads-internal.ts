import "server-only"

import { getDb } from "@/lib/db"
import { CONSENT_TEXT_VERSION } from "@/lib/konfigurator/consent"
import type { Lead } from "@/lib/konfigurator/types"

/**
 * Interne Lead-Helper, bewusst NICHT aus einer "use server"-Datei exportiert.
 * Als Server Actions wären diese Funktionen theoretisch direkt aufrufbar
 * (z. B. Verifikation ohne DOI, Lead-Lookup per ID). Durch `server-only`
 * (ohne "use server") entstehen keine Server-Action-Oberflächen; nutzbar nur
 * für serverseitigen Code, der eigene Auth-/Kanal-Checks durchführt.
 */
export async function getLeadById(id: number): Promise<Lead | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, email, name, firma, telefon, verified_at, marketing_consent, consent_text_version, consent_ip, customer_id, created_at
    FROM leads WHERE id = ${id} LIMIT 1
  `
  return rows.length ? (rows[0] as Lead) : null
}

/** Lead für externe Kanäle (n8n / manuelle Admin-Anlage) – automatisch verifiziert. */
export async function getOrCreateVerifiedLeadForEmail(email: string): Promise<Lead> {
  const normalized = email.trim().toLowerCase()
  const sql = getDb()

  const existing = await sql`
    SELECT id, email, name, firma, telefon, verified_at, marketing_consent, consent_text_version, consent_ip, customer_id, created_at
    FROM leads WHERE email = ${normalized} LIMIT 1
  `

  if (existing.length > 0) {
    if (!existing[0].verified_at) {
      await sql`UPDATE leads SET verified_at = NOW(), updated_at = NOW() WHERE id = ${existing[0].id}`
    }
    return { ...existing[0], verified_at: existing[0].verified_at || new Date().toISOString() } as Lead
  }

  const created = await sql`
    INSERT INTO leads (email, marketing_consent, consent_text_version, verified_at)
    VALUES (${normalized}, false, ${CONSENT_TEXT_VERSION}, NOW())
    RETURNING id, email, name, firma, telefon, verified_at, marketing_consent, consent_text_version, consent_ip, customer_id, created_at
  `
  return created[0] as Lead
}
