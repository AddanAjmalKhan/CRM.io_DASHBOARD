import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib'

export interface PdfFieldConfig {
  id: string
  text: string         // full text with {{variable}} placeholders inline
  x: number            // 0–100 (% from left)
  y: number            // 0–100 (% from top)
  fontSize: number
  color: string        // hex e.g. "#161642"
  bold: boolean
  align: 'left' | 'center' | 'right'
  maxWidth: number     // 0–100 (% of page width, for wrapping)
}

export interface TemplateData {
  backgroundUrl: string
  fields: PdfFieldConfig[]
  orientation?: 'portrait' | 'landscape'
}

export interface SubmissionVars {
  firstName: string
  lastName: string
  businessName: string
  serialNumber: string
  email: string
  fullName?: string
  address?: string
  agentName?: string
  date?: string
  time?: string
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255
  return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b }
}

function resolveText(text: string, vars: SubmissionVars): string {
  const map: Record<string, string> = {
    firstName: vars.firstName,
    lastName: vars.lastName,
    businessName: vars.businessName,
    serialNumber: vars.serialNumber,
    email: vars.email,
    fullName: vars.fullName ?? `${vars.firstName} ${vars.lastName}`,
    address: vars.address ?? '',
    agentName: vars.agentName ?? '',
    date: vars.date ?? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' }),
    time: vars.time ?? new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }),
  }
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => map[key] ?? `{{${key}}}`)
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidthPts: number): string[] {
  const hardLines = text.split('\n')
  const result: string[] = []

  for (const line of hardLines) {
    if (!line.trim()) { result.push(''); continue }
    const words = line.split(' ')
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidthPts) {
        current = candidate
      } else {
        if (current) result.push(current)
        current = word
      }
    }
    if (current) result.push(current)
  }

  return result
}

export async function generateTemplatePdf(
  template: TemplateData,
  vars: SubmissionVars
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()

  const imgRes = await fetch(template.backgroundUrl)
  if (!imgRes.ok) throw new Error(`Failed to fetch letterhead: ${imgRes.status}`)
  const imgBytes = await imgRes.arrayBuffer()

  const url = template.backgroundUrl.toLowerCase()
  let embeddedImg
  if (url.includes('.png') || url.includes('png')) {
    embeddedImg = await pdfDoc.embedPng(imgBytes)
  } else {
    try { embeddedImg = await pdfDoc.embedJpg(imgBytes) }
    catch { embeddedImg = await pdfDoc.embedPng(imgBytes) }
  }

  const isLandscape = template.orientation === 'landscape'
  const pageWidth = isLandscape ? 841.89 : 595.28
  const pageHeight = isLandscape ? 595.28 : 841.89

  const page = pdfDoc.addPage([pageWidth, pageHeight])
  page.drawImage(embeddedImg, { x: 0, y: 0, width: pageWidth, height: pageHeight })

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  for (const field of template.fields) {
    if (!field.text?.trim()) continue

    const resolved = resolveText(field.text, vars)
    const font = field.bold ? boldFont : regularFont
    const fontSize = field.fontSize || 12
    const { r, g, b } = hexToRgb(field.color || '#000000')

    const maxWidthPts = ((field.maxWidth ?? 80) / 100) * pageWidth
    const lines = wrapText(resolved, font, fontSize, maxWidthPts)
    const lineHeight = fontSize * 1.35

    const xPt = (field.x / 100) * pageWidth
    const startYPt = pageHeight - (field.y / 100) * pageHeight

    lines.forEach((line, idx) => {
      if (!line) return

      let drawX = xPt
      if (field.align === 'center' || field.align === 'right') {
        const w = font.widthOfTextAtSize(line, fontSize)
        drawX = field.align === 'center' ? xPt - w / 2 : xPt - w
      }

      page.drawText(line, {
        x: Math.max(0, drawX),
        y: startYPt - idx * lineHeight - fontSize,
        size: fontSize,
        font,
        color: rgb(r, g, b),
      })
    })
  }

  return Buffer.from(await pdfDoc.save())
}
