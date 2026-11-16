-- Soft-Archive für Anfragen/Aufträge
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_quote_requests_archived_at
  ON quote_requests (archived_at);
