-- Kunden-Mail bei Storno (quote_cancelled)

INSERT INTO email_templates (template_key, label, category, subject, body, send_by_default)
VALUES (
  'quote_cancelled',
  'Storno',
  'quote',
  'Auftrag storniert – WIRKUNG Wristlink',
  '{{kunde_anrede}}

dein Auftrag {{auftrags_nr}} wurde storniert.

{{ablehnungsgrund}}

Wenn du Fragen hast oder eine neue Anfrage stellen möchtest, melde dich gern unter tech@wirkung-digital.de.

Bitte nicht auf diese E-Mail antworten.

Viele Grüße
Dein WIRKUNG-Team',
  true
)
ON CONFLICT (template_key) DO NOTHING;
