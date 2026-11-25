const URL_RE = /https?:\/\/[^\s<>\n]+/g
const BROKEN_URL_RE = /(https?:\/\/[^\s<>\n/]+)\s*\n\s*(\/[^\s<>\n]*)/g

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function normalizeBrokenUrls(text: string): string {
  let result = text
  let prev = ""
  while (result !== prev) {
    prev = result
    result = result.replace(BROKEN_URL_RE, (_, start: string, path: string) => start + path)
  }
  return result
}

export function linkLabel(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.pathname.startsWith("/angebot/") && parsed.pathname.endsWith("/bezahlen")) {
      return "Jetzt online bezahlen"
    }
    if (parsed.pathname.startsWith("/angebot/") && parsed.searchParams.has("annehmen")) {
      return "Angebot ansehen & annehmen"
    }
    if (parsed.pathname.startsWith("/angebot/")) {
      return "Angebot und Status öffnen"
    }
    if (
      parsed.hostname === "checkout.stripe.com" ||
      parsed.hostname.endsWith(".stripe.com") ||
      parsed.pathname.includes("checkout")
    ) {
      return "Jetzt online bezahlen"
    }
    if (parsed.pathname.startsWith("/konfigurator/verify")) {
      return "E-Mail-Adresse bestätigen"
    }
  } catch {
    // ignore invalid URLs
  }
  return url
}

export function wrapUrlsForPlainText(text: string): string {
  return normalizeBrokenUrls(text).replace(URL_RE, (url, offset, full) => {
    const before = full[offset - 1]
    const after = full[offset + url.length]
    if (before === "<" && after === ">") return url
    return `<${url}>`
  })
}

function linkifyEscapedText(text: string): string {
  let html = ""
  let lastIndex = 0

  for (const match of text.matchAll(URL_RE)) {
    const url = match[0]
    const index = match.index ?? 0
    html += escapeHtml(text.slice(lastIndex, index))
    const safeUrl = escapeHtml(url)
    const label = linkLabel(url)
    const safeLabel = escapeHtml(label)
    if (label === url) {
      html += `<a href="${safeUrl}" style="color:#2563eb;text-decoration:underline;word-break:break-all;">${safeLabel}</a>`
    } else {
      html += `<a href="${safeUrl}" style="color:#2563eb;text-decoration:underline;">${safeLabel}</a>`
    }
    lastIndex = index + url.length
  }

  html += escapeHtml(text.slice(lastIndex))
  return html
}

const FONT = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"
const ONLY_URL_RE = /^https?:\/\/\S+$/
const KEY_VALUE_RE = /^([^:]{2,60}):\s+(\S.*)$/

function renderButton(url: string, label: string, primary: boolean): string {
  const bg = primary ? "#111827" : "#ffffff"
  const color = primary ? "#ffffff" : "#111827"
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr><td style="border-radius:8px;background:${bg};border:1px solid #111827;">
<a href="${escapeHtml(url)}" style="${FONT}display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:${color};text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
</td></tr></table>`
}

function renderKeyValueTable(rows: [string, string][]): string {
  const body = rows
    .map(([key, value], i) => {
      const last = i === rows.length - 1
      const weight = last ? "font-weight:700;font-size:16px;" : "color:#4b5563;"
      const border = last ? "border-top:1px solid #e5e7eb;" : ""
      return `<tr><td style="${FONT}padding:6px 0;${border}${weight}">${escapeHtml(key)}</td><td align="right" style="${FONT}padding:6px 0;${border}${weight}white-space:nowrap;">${escapeHtml(value)}</td></tr>`
    })
    .join("\n")
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
${body}
</table>`
}

/** Absatz-basiertes Rendering: URL-Zeilen werden Buttons, „Label: Wert“-Blöcke eine Tabelle. */
function renderParagraph(paragraph: string, state: { buttonCount: number }): string {
  const lines = paragraph.split("\n").map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return ""

  if (paragraph.startsWith("Bitte nicht auf diese E-Mail")) {
    return `<p style="${FONT}margin:24px 0 0;font-size:12px;line-height:1.5;color:#6b7280;">${linkifyEscapedText(lines.join("\n")).replace(/\n/g, "<br>")}</p>`
  }

  const urlLine = lines[lines.length - 1]
  const labelLines = lines.slice(0, -1)
  if (ONLY_URL_RE.test(urlLine) && labelLines.length <= 1 && linkLabel(urlLine) !== urlLine) {
    const primary = state.buttonCount === 0
    state.buttonCount++
    const intro = labelLines.length && !labelLines[0].endsWith(":")
      ? `<p style="${FONT}margin:16px 0 0;font-size:15px;line-height:1.6;">${escapeHtml(labelLines[0])}</p>`
      : ""
    return intro + renderButton(urlLine, linkLabel(urlLine), primary)
  }

  if (lines.length >= 2 && lines.every((l) => KEY_VALUE_RE.test(l) && !/https?:\/\//.test(l))) {
    const rows = lines.map((l) => {
      const m = l.match(KEY_VALUE_RE)!
      return [m[1], m[2]] as [string, string]
    })
    return renderKeyValueTable(rows)
  }

  return `<p style="${FONT}margin:16px 0 0;font-size:15px;line-height:1.6;">${linkifyEscapedText(lines.join("\n")).replace(/\n/g, "<br>\n")}</p>`
}

export function plainTextToHtml(text: string): string {
  const normalized = normalizeBrokenUrls(text).replace(/\r\n/g, "\n").trim()
  const state = { buttonCount: 0 }
  const body = normalized
    .split(/\n{2,}/)
    .map((p) => renderParagraph(p, state))
    .join("\n")
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;color:#111827;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
<tr><td style="${FONT}background:#111827;color:#ffffff;padding:18px 28px;font-size:16px;font-weight:700;letter-spacing:0.3px;">WIRKUNG Wristlink</td></tr>
<tr><td style="padding:12px 28px 28px;">
${body}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

export function buildEmailBodies(text: string): { text: string; html: string } {
  const normalized = normalizeBrokenUrls(text)
  return {
    text: wrapUrlsForPlainText(normalized),
    html: plainTextToHtml(normalized),
  }
}
