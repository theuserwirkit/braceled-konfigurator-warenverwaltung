-- Angebotsannahme durch den Kunden: Angebot versenden → Kunde nimmt an → Zahlung

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS offer_payment_mode VARCHAR(20),
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_ip TEXT;

UPDATE email_templates SET
  label = 'Angebot versendet (Stripe)',
  subject = 'Dein Angebot {{auftrags_nr}} – WIRKUNG Wristlink',
  body = '{{kunde_anrede}}

vielen Dank für deine Anfrage! Wir haben alles geprüft und freuen uns, dir unser Angebot zu deinem Auftrag {{auftrags_nr}} unterbreiten zu können.

Angebotssumme netto: {{angebot_netto_eur}}
zzgl. 19 % MwSt.: {{angebot_mwst_eur}}
Gesamtbetrag: {{angebot_brutto_eur}}

Wir halten die LED-Armbänder bis zum {{gueltig_bis}} für dich bereit.

Angebot ansehen und annehmen:
{{annahme_url}}

Nach der Annahme kannst du direkt online bezahlen – mit dem Zahlungseingang ist dein Termin fest gebucht. Den Zugang zur Angebotsseite erhältst du mit der Postleitzahl deiner Firmenadresse.

Viele Grüße
Dein WIRKUNG-Team

Bitte nicht auf diese E-Mail antworten. Fragen bitte an tech@wirkung-digital.de',
  updated_at = NOW()
WHERE template_key = 'quote_approved_stripe';

UPDATE email_templates SET
  label = 'Angebot versendet (Rechnung)',
  subject = 'Dein Angebot {{auftrags_nr}} – WIRKUNG Wristlink',
  body = '{{kunde_anrede}}

vielen Dank für deine Anfrage! Wir haben alles geprüft und freuen uns, dir unser Angebot zu deinem Auftrag {{auftrags_nr}} unterbreiten zu können.

Angebotssumme netto: {{angebot_netto_eur}}
zzgl. 19 % MwSt.: {{angebot_mwst_eur}}
Gesamtbetrag: {{angebot_brutto_eur}}

Wir halten die LED-Armbänder bis zum {{gueltig_bis}} für dich bereit.

Angebot ansehen und annehmen:
{{annahme_url}}

Nach der Annahme erhältst du die Rechnung per E-Mail – mit dem Zahlungseingang ist dein Termin fest gebucht. Den Zugang zur Angebotsseite erhältst du mit der Postleitzahl deiner Firmenadresse.

Viele Grüße
Dein WIRKUNG-Team

Bitte nicht auf diese E-Mail antworten. Fragen bitte an tech@wirkung-digital.de',
  updated_at = NOW()
WHERE template_key = 'quote_approved_manual';

INSERT INTO email_templates (template_key, label, category, subject, body, send_by_default)
VALUES (
  'quote_accepted_stripe',
  'Angebot angenommen (Stripe)',
  'quote',
  'Angebot angenommen – {{auftrags_nr}} – WIRKUNG Wristlink',
  '{{kunde_anrede}}

vielen Dank – du hast unser Angebot zu deinem Auftrag {{auftrags_nr}} angenommen. Wir freuen uns auf dein Event!

Angebotssumme netto: {{angebot_netto_eur}}
zzgl. 19 % MwSt.: {{angebot_mwst_eur}}
Zahlungsbetrag: {{angebot_brutto_eur}}

Jetzt bezahlen und Termin sichern:
{{bezahlen_url}}

Bitte schließe die Zahlung bis zum {{gueltig_bis}} ab. Sobald sie eingegangen ist, ist dein Termin fest gebucht und wir starten mit der Vorbereitung.

Angebot und aktuellen Status findest du hier:
{{status_url}}

Viele Grüße
Dein WIRKUNG-Team

Bitte nicht auf diese E-Mail antworten. Fragen bitte an tech@wirkung-digital.de',
  true
)
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO email_templates (template_key, label, category, subject, body, send_by_default)
VALUES (
  'quote_accepted_manual',
  'Angebot angenommen (Rechnung)',
  'quote',
  'Angebot angenommen – {{auftrags_nr}} – WIRKUNG Wristlink',
  '{{kunde_anrede}}

vielen Dank – du hast unser Angebot zu deinem Auftrag {{auftrags_nr}} angenommen. Wir freuen uns auf dein Event!

Angebotssumme netto: {{angebot_netto_eur}}
zzgl. 19 % MwSt.: {{angebot_mwst_eur}}
Zahlungsbetrag: {{angebot_brutto_eur}}

Die Rechnung erhältst du in Kürze per E-Mail. Sobald die Zahlung eingegangen ist, ist dein Termin fest gebucht und wir starten mit der Vorbereitung.

Angebot und aktuellen Status findest du hier:
{{status_url}}

Viele Grüße
Dein WIRKUNG-Team

Bitte nicht auf diese E-Mail antworten. Fragen bitte an tech@wirkung-digital.de',
  true
)
ON CONFLICT (template_key) DO NOTHING;
