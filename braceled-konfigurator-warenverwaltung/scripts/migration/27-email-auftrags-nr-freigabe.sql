-- Freigabe-Mails: Auftrag statt Anfrage + Auftragsnummer

UPDATE email_templates SET
  body = '{{kunde_anrede}}

wir haben deinen Auftrag {{auftrags_nr}} geprüft und dein Angebot freigegeben. Deine LED-Armbänder sind für dich reserviert – damit ist der erste Schritt für dein Event gesichert.

Angebotssumme netto: {{angebot_netto}} EUR
Zahlungsbetrag inkl. 19 % MwSt.: {{angebot_brutto}} EUR

Zum Bezahlen und Termin sichern:
{{zahlungslink}}

Angebot und aktuellen Status findest du hier (Zugang mit der Postleitzahl deiner Firmenadresse):
{{status_url}}

Bitte nicht auf diese E-Mail antworten. Fragen bitte an tech@wirkung-digital.de

Viele Grüße
Dein WIRKUNG-Team',
  updated_at = NOW()
WHERE template_key = 'quote_approved_stripe';

UPDATE email_templates SET
  body = '{{kunde_anrede}}

wir haben deinen Auftrag {{auftrags_nr}} geprüft und dein Angebot freigegeben. Deine LED-Armbänder sind für dich reserviert – damit ist der erste Schritt für dein Event gesichert.

Angebotssumme netto: {{angebot_netto}} EUR
Zahlungsbetrag inkl. 19 % MwSt.: {{angebot_brutto}} EUR

Rechnung und Zahlungsdetails erhältst du in Kürze per E-Mail.

Angebot und aktuellen Status findest du hier (Zugang mit der Postleitzahl deiner Firmenadresse):
{{status_url}}

Bitte nicht auf diese E-Mail antworten. Fragen bitte an tech@wirkung-digital.de

Viele Grüße
Dein WIRKUNG-Team',
  updated_at = NOW()
WHERE template_key = 'quote_approved_manual';

UPDATE email_templates SET
  subject = 'Zu deinem Auftrag – WIRKUNG Wristlink',
  body = '{{kunde_anrede}}

vielen Dank für deinen Auftrag {{auftrags_nr}}. Leider können wir ihn in der gewünschten Form gerade nicht bestätigen – das tut uns leid.

{{ablehnungsgrund}}

Wenn du magst, schauen wir gemeinsam nach einer Alternative. Melde dich einfach unter tech@wirkung-digital.de.

Bitte nicht auf diese E-Mail antworten.

Viele Grüße
Dein WIRKUNG-Team',
  updated_at = NOW()
WHERE template_key = 'quote_rejected';
