-- Team-Feedback: Auftragsnummer, weichere Absage, Auftrag statt Anfrage in Fulfillment-Mails

UPDATE email_templates SET
  subject = 'Zu deinem Auftrag – WIRKUNG Wristlink',
  body = '{{kunde_anrede}}

vielen Dank für deine Anfrage. Leider können wir sie in der gewünschten Form gerade nicht bestätigen – das tut uns leid.

{{ablehnungsgrund}}

Wenn du magst, schauen wir gemeinsam nach einer Alternative. Melde dich einfach unter tech@wirkung-digital.de.

Bitte nicht auf diese E-Mail antworten.

Viele Grüße
Dein WIRKUNG-Team',
  updated_at = NOW()
WHERE template_key = 'quote_rejected';

UPDATE email_templates SET
  body = '{{kunde_anrede}}

unser Team hat deine LED-Armbänder disponiert (Auftrag {{auftrags_nr}}). Damit dein Event reibungslos läuft, starten wir jetzt mit der Vorbereitung in unserem Lager.

{{kommentar}}

Aktuellen Status findest du hier:
{{status_url}}

Bitte nicht auf diese E-Mail antworten. Fragen bitte an tech@wirkung-digital.de

Viele Grüße
Dein WIRKUNG-Team',
  updated_at = NOW()
WHERE template_key = 'fulfillment_vorbereitet';

UPDATE email_templates SET
  body = '{{kunde_anrede}}

die LED-Armbänder für deinen Auftrag {{auftrags_nr}} sind bedruckt und bereit für den nächsten Schritt – und sie sehen so cool aus! Dein Logo kommt auf den Bändern richtig gut zur Geltung.

{{kommentar}}

Details und Status:
{{status_url}}

Bitte nicht auf diese E-Mail antworten. Fragen bitte an tech@wirkung-digital.de

Viele Grüße
Dein WIRKUNG-Team',
  updated_at = NOW()
WHERE template_key = 'fulfillment_bedruckt';

UPDATE email_templates SET
  body = '{{kunde_anrede}}

dein Auftrag {{auftrags_nr}} ist verpackt und bereit für den Versand. Alles ist sicher verstaut – deine Bänder warten nur noch auf die Abholung.

{{kommentar}}

Aktuellen Status findest du hier:
{{status_url}}

Bitte nicht auf diese E-Mail antworten. Fragen bitte an tech@wirkung-digital.de

Viele Grüße
Dein WIRKUNG-Team',
  updated_at = NOW()
WHERE template_key = 'fulfillment_verpackt';

UPDATE email_templates SET
  body = '{{kunde_anrede}}

wir haben den Versand für deinen Auftrag {{auftrags_nr}} beauftragt. Der Versanddienstleister ist informiert – bald geht deine Sendung auf die Reise zu dir.

Versanddienstleister: {{versand_dienstleister}}
Sendungsverfolgung: {{tracking_nr}}

{{kommentar}}

Aktuellen Status findest du hier:
{{status_url}}

Bitte nicht auf diese E-Mail antworten. Fragen bitte an tech@wirkung-digital.de

Viele Grüße
Dein WIRKUNG-Team',
  updated_at = NOW()
WHERE template_key = 'fulfillment_versand_beauftragt';

UPDATE email_templates SET
  body = '{{kunde_anrede}}

dein Auftrag {{auftrags_nr}} wurde versandt und ist auf dem Weg zu dir. Bald können die ersten Lichteffekte auf deinem Event getestet werden.

Versanddienstleister: {{versand_dienstleister}}
Sendungsverfolgung: {{tracking_nr}}

{{kommentar}}

Details und Status:
{{status_url}}

Bitte nicht auf diese E-Mail antworten. Fragen bitte an tech@wirkung-digital.de

Viele Grüße
Dein WIRKUNG-Team',
  updated_at = NOW()
WHERE template_key = 'fulfillment_versandt';

UPDATE email_templates SET
  body = '{{kunde_anrede}}

deine Rücksendung zu Auftrag {{auftrags_nr}} ist bei uns eingegangen. Vielen Dank – wir kümmern uns jetzt um die weitere Verarbeitung.

{{kommentar}}

Aktuellen Status findest du hier:
{{status_url}}

Bitte nicht auf diese E-Mail antworten. Fragen bitte an tech@wirkung-digital.de

Viele Grüße
Dein WIRKUNG-Team',
  updated_at = NOW()
WHERE template_key = 'fulfillment_ruecksendung_angekommen';

UPDATE email_templates SET
  body = '{{kunde_anrede}}

wir haben die zurückgesendeten LED-Armbänder zu Auftrag {{auftrags_nr}} eingepackt und verarbeitet. Damit ist der Vorgang abgeschlossen – danke, dass du uns die Bänder zurückgeschickt hast.

{{kommentar}}

Abschluss-Status:
{{status_url}}

Bitte nicht auf diese E-Mail antworten. Fragen bitte an tech@wirkung-digital.de

Viele Grüße
Dein WIRKUNG-Team',
  updated_at = NOW()
WHERE template_key = 'fulfillment_zurueckgepackt';
