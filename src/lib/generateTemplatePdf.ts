import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { readFile } from 'fs/promises'
import path from 'path'

export type PdfFontFamily =
  | 'Helvetica' | 'TimesRoman' | 'Courier'
  | 'Tinos' | 'Roboto' | 'RobotoMono' | 'Gelasio'
  | 'PlayfairDisplay' | 'Merriweather' | 'Montserrat' | 'OpenSans' | 'GreatVibes'

// Standard-14 fonts need no file — everything else is a real font file under src/fonts/.
const STANDARD_FONT_KEYS: Record<'Helvetica' | 'TimesRoman' | 'Courier', [StandardFonts, StandardFonts, StandardFonts, StandardFonts]> = {
  Helvetica:  [StandardFonts.Helvetica, StandardFonts.HelveticaBold, StandardFonts.HelveticaOblique, StandardFonts.HelveticaBoldOblique],
  TimesRoman: [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold, StandardFonts.TimesRomanItalic, StandardFonts.TimesRomanBoldItalic],
  Courier:    [StandardFonts.Courier, StandardFonts.CourierBold, StandardFonts.CourierOblique, StandardFonts.CourierBoldOblique],
}

// Custom (embedded) font files. Families without a distinct bold/italic face
// (e.g. GreatVibes) reuse "Regular" for those slots.
const CUSTOM_FONT_FILES: Record<Exclude<PdfFontFamily, keyof typeof STANDARD_FONT_KEYS>, [string, string, string, string]> = {
  Tinos:           ['Tinos-Regular.ttf', 'Tinos-Bold.ttf', 'Tinos-Italic.ttf', 'Tinos-BoldItalic.ttf'],
  Roboto:          ['Roboto-Regular.ttf', 'Roboto-Bold.ttf', 'Roboto-Italic.ttf', 'Roboto-BoldItalic.ttf'],
  RobotoMono:      ['RobotoMono-Regular.ttf', 'RobotoMono-Bold.ttf', 'RobotoMono-Italic.ttf', 'RobotoMono-BoldItalic.ttf'],
  Gelasio:         ['Gelasio-Regular.ttf', 'Gelasio-Bold.ttf', 'Gelasio-Italic.ttf', 'Gelasio-BoldItalic.ttf'],
  PlayfairDisplay: ['PlayfairDisplay-Regular.ttf', 'PlayfairDisplay-Bold.ttf', 'PlayfairDisplay-Italic.ttf', 'PlayfairDisplay-BoldItalic.ttf'],
  Merriweather:    ['Merriweather-Regular.ttf', 'Merriweather-Bold.ttf', 'Merriweather-Italic.ttf', 'Merriweather-BoldItalic.ttf'],
  Montserrat:      ['Montserrat-Regular.ttf', 'Montserrat-Bold.ttf', 'Montserrat-Italic.ttf', 'Montserrat-BoldItalic.ttf'],
  OpenSans:        ['OpenSans-Regular.ttf', 'OpenSans-Bold.ttf', 'OpenSans-Italic.ttf', 'OpenSans-BoldItalic.ttf'],
  GreatVibes:      ['GreatVibes-Regular.ttf', 'GreatVibes-Regular.ttf', 'GreatVibes-Regular.ttf', 'GreatVibes-Regular.ttf'],
}

export interface PdfFieldConfig {
  id: string
  text: string         // full text with {{variable}} placeholders inline
  x: number            // 0–100 (% from left)
  y: number            // 0–100 (% from top)
  fontSize: number
  color: string        // hex e.g. "#161642"
  bold: boolean
  italic?: boolean
  underline?: boolean
  fontFamily?: PdfFontFamily
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

  pdfDoc.registerFontkit(fontkit)
  const fontCache = new Map<string, PDFFont>()

  async function getFont(family: PdfFontFamily, bold: boolean, italic: boolean): Promise<PDFFont> {
    const slot = (bold ? 1 : 0) + (italic ? 2 : 0)
    const cacheKey = `${family}-${slot}`
    const cached = fontCache.get(cacheKey)
    if (cached) return cached

    let font: PDFFont
    if (family in STANDARD_FONT_KEYS) {
      const std = STANDARD_FONT_KEYS[family as keyof typeof STANDARD_FONT_KEYS][slot]
      font = await pdfDoc.embedFont(std)
    } else {
      const fileName = CUSTOM_FONT_FILES[family as keyof typeof CUSTOM_FONT_FILES][slot]
      const fileBytes = await readFile(path.join(process.cwd(), 'src', 'fonts', family, fileName))
      font = await pdfDoc.embedFont(fileBytes)
    }

    fontCache.set(cacheKey, font)
    return font
  }

  for (const field of template.fields) {
    if (!field.text?.trim()) continue

    const resolved = resolveText(field.text, vars)
    const font = await getFont(field.fontFamily ?? 'Helvetica', field.bold, field.italic ?? false)
    const fontSize = field.fontSize || 12
    const { r, g, b } = hexToRgb(field.color || '#000000')

    const maxWidthPts = ((field.maxWidth ?? 80) / 100) * pageWidth
    const lines = wrapText(resolved, font, fontSize, maxWidthPts)
    const lineHeight = fontSize * 1.35

    const xPt = (field.x / 100) * pageWidth
    const startYPt = pageHeight - (field.y / 100) * pageHeight

    lines.forEach((line, idx) => {
      if (!line) return

      const w = font.widthOfTextAtSize(line, fontSize)
      let drawX = xPt
      if (field.align === 'center' || field.align === 'right') {
        drawX = field.align === 'center' ? xPt - w / 2 : xPt - w
      }
      drawX = Math.max(0, drawX)
      const y = startYPt - idx * lineHeight - fontSize

      page.drawText(line, {
        x: drawX,
        y,
        size: fontSize,
        font,
        color: rgb(r, g, b),
      })

      if (field.underline) {
        page.drawLine({
          start: { x: drawX, y: y - fontSize * 0.08 },
          end: { x: drawX + w, y: y - fontSize * 0.08 },
          thickness: Math.max(1, fontSize * 0.05),
          color: rgb(r, g, b),
        })
      }
    })
  }

  return Buffer.from(await pdfDoc.save())
}
