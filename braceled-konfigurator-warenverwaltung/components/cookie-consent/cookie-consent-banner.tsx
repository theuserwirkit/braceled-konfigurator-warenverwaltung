"use client"

import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function CookieConsentBanner({
  marketing,
  onMarketingChange,
  onSave,
  onAcceptAll,
  onRejectOptional,
}: {
  marketing: boolean
  onMarketingChange: (value: boolean) => void
  onSave: () => void
  onAcceptAll: () => void
  onRejectOptional: () => void
}) {
  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:p-5"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div>
          <h2 id="cookie-consent-title" className="text-base font-semibold text-foreground">
            Cookie-Einstellungen
          </h2>
          <p id="cookie-consent-desc" className="mt-1 text-sm text-muted-foreground">
            Wir nutzen notwendige Cookies und – nur mit Ihrer Einwilligung – Marketing. Mehr in der{" "}
            <Link href="/datenschutz#cookies" className="underline underline-offset-2 hover:text-foreground">
              Datenschutzerklärung
            </Link>
            .
          </p>
        </div>

        <div className="space-y-3 rounded-md border border-border p-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm font-medium">Notwendig</Label>
              <p className="text-xs text-muted-foreground">Für Betrieb und Sicherheit der Website.</p>
            </div>
            <Switch checked disabled aria-label="Notwendige Cookies immer aktiv" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="cookie-marketing" className="text-sm font-medium">
                Marketing
              </Label>
              <p className="text-xs text-muted-foreground">
                Messung und Optimierung von Werbung (optional, standardmäßig aus).
              </p>
            </div>
            <Switch
              id="cookie-marketing"
              checked={marketing}
              onCheckedChange={onMarketingChange}
              aria-label="Marketing-Cookies"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onRejectOptional}>
            Nur Notwendige
          </Button>
          <Button type="button" variant="secondary" onClick={onSave}>
            Auswahl speichern
          </Button>
          <Button type="button" onClick={onAcceptAll}>
            Alle akzeptieren
          </Button>
        </div>
      </div>
    </div>
  )
}
