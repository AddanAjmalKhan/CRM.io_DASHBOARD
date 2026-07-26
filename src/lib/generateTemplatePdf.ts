import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface PdfFieldConfig {
  id: string
  variable: string
  x: number        // 0-100 (% from left)
  y: number        // 0-100 (% from top)
  fontSize: number
  color: string    // hex e.g. "#161642"
  bold: boolean
  align: 'left' | 'center' | 'right'
  label?: string
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
  date?: string
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255
  return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b }
}

function resolveVar(variable: string, vars: SubmissionVars): string {
  const map: Record<string, string> = {
    firstName: vars.firstName,
    lastName: vars.lastName,
    businessName: vars.businessName,
    serialNumber: vars.serialNumber,
    email: vars.email,
    fullName: vars.fullName ?? `${vars.firstName} ${vars.lastName}`,
    date: vars.date ?? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  }
  return map[variable] ?? variable
}

export async function generateTemplatePdf(
  template: TemplateData,
  vars: SubmissionVars
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()

  // Fetch the background image
  const imgRes = await fetch(template.backgroundUrl)
  if (!imgRes.ok) throw new Error(`Failed to fetch letterhead: ${imgRes.status}`)
  const imgBytes = await imgRes.arrayBuffer()

  const url = template.backgroundUrl.toLowerCase()
  const isPng = url.includes('.png') || url.includes('png')
  const isJpg = url.includes('.jpg') || url.includes('.jpeg') || url.includes('jpg') || url.includes('jpeg')

  let embeddedImg
  if (isPng) {
    embeddedImg = await pdfDoc.embedPng(imgBytes)
  } else if (isJpg) {
    embeddedImg = await pdfDoc.embedJpg(imgBytes)
  } else {
    // Try PNG first, fall back to JPG
    try {
      embeddedImg = await pdfDoc.embedPng(imgBytes)
    } catch {
      embeddedImg = await pdfDoc.embedJpg(imgBytes)
    }
  }

  // Create page — use image dimensions or A4
  const isLandscape = template.orientation === 'landscape'
  const pageWidth = isLandscape ? 841.89 : 595.28
  const pageHeight = isLandscape ? 595.28 : 841.89

  const page = pdfDoc.addPage([pageWidth, pageHeight])

  // Draw background image filling the entire page
  page.drawImage(embeddedImg, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  })

  // Load fonts
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Draw each field
  for (const field of template.fields) {
    const text = resolveVar(field.variable, vars)
    if (!text) continue

    const font = field.bold ? boldFont : regularFont
    const fontSize = field.fontSize || 12
    const { r, g, b } = hexToRgb(field.color || '#000000')

    // Convert percentage positions to pdf-lib coordinates
    // x: % from left → points from left
    // y: % from top → points from bottom (pdf-lib uses bottom-left origin)
    const xPt = (field.x / 100) * pageWidth
    const yPt = pageHeight - (field.y / 100) * pageHeight

    // Handle alignment
    let drawX = xPt
    if (field.align === 'center' || field.align === 'right') {
      const textWidth = font.widthOfTextAtSize(text, fontSize)
      if (field.align === 'center') drawX = xPt - textWidth / 2
      else drawX = xPt - textWidth
    }

    page.drawText(text, {
      x: drawX,
      y: yPt - fontSize, // baseline adjust
      size: fontSize,
      font,
      color: rgb(r, g, b),
    })
  }

  const bytes = await pdfDoc.save()
  return Buffer.from(bytes)
}
