import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateCertificatePdf } from '@/lib/generateCertificatePdf'

export const runtime = 'nodejs'
export const maxDuration = 60

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function fillVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

function bodyToHtml(text: string): string {
  return text
    .split('\n')
    .map(line => line.trim() === '' ? '<br/>' : `<p style="margin:0 0 8px 0;">${line}</p>`)
    .join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, businessName, serialNumber, email, emailTemplateId, pdfTemplateIds } = body

    if (!firstName || !lastName || !businessName || !serialNumber || !email) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (!emailTemplateId) {
      return NextResponse.json({ error: 'Email template is required' }, { status: 400 })
    }
    if (!pdfTemplateIds?.length) {
      return NextResponse.json({ error: 'Select at least one PDF template' }, { status: 400 })
    }

    const supabase = adminClient()

    const { data: emailTpl, error: emailErr } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', emailTemplateId)
      .single()

    if (emailErr || !emailTpl) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 })
    }

    const { data: pdfTpls, error: pdfErr } = await supabase
      .from('pdf_templates')
      .select('*')
      .in('id', pdfTemplateIds)

    if (pdfErr || !pdfTpls?.length) {
      return NextResponse.json({ error: 'PDF template(s) not found' }, { status: 404 })
    }

    const vars = { firstName, lastName, businessName, serialNumber, email }

    const filledSubject = fillVariables(emailTpl.subject, vars)
    const filledBody = fillVariables(emailTpl.body, vars)
    const htmlBody = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
        ${bodyToHtml(filledBody)}
      </div>
    `

    const pdfBuffers = await Promise.all(
      pdfTpls.map(tpl =>
        generateCertificatePdf({
          firstName,
          lastName,
          businessName,
          serialNumber,
          title: tpl.title,
          subtitle: tpl.subtitle ?? '',
          footerText: tpl.footer_text ?? '',
        })
      )
    )

    const attachments = pdfTpls.map((tpl, i) => ({
      filename: `${tpl.name.replace(/\s+/g, '_')}_${serialNumber}.pdf`,
      content: pdfBuffers[i],
    }))

    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM ?? 'Business Hub <onboarding@resend.dev>'

    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
    }

    const resend = new Resend(apiKey)
    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: filledSubject,
      html: htmlBody,
      attachments,
    })

    if (sendError) {
      console.error('[submissions] resend error:', sendError)
      return NextResponse.json({ error: 'Failed to send email: ' + (sendError as any).message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[submissions] error:', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
