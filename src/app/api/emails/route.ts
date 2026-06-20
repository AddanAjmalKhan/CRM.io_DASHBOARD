import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import nodemailer from 'nodemailer'
import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

type Account = 'IntelTrademark' | 'Office101' | 'Office102'

const ACCOUNTS: Record<Account, { imapHost: string; smtpHost: string; imapPort: number; smtpPort: number; user: string; passKey: string }> = {
  IntelTrademark: {
    imapHost: 'premium77.web-hosting.com', smtpHost: 'premium77.web-hosting.com',
    imapPort: 993, smtpPort: 465,
    user: 'Info@inteltrademark.com',
    passKey: 'EMAIL_PASS_INTELTRADEMARK',
  },
  Office101: {
    imapHost: 'office101llc.com', smtpHost: 'office101llc.com',
    imapPort: 993, smtpPort: 465,
    user: 'info@office101llc.com',
    passKey: 'EMAIL_PASS_OFFICE101',
  },
  Office102: {
    imapHost: 'mail.office102llc.com', smtpHost: 'mail.office102llc.com',
    imapPort: 993, smtpPort: 465,
    user: 'Info@office102llc.com',
    passKey: 'EMAIL_PASS_OFFICE102',
  },
}

function relativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  <  1) return 'Just now'
  if (hours <  1) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  if (hours < 24) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  if (days  === 1) return 'Yesterday'
  if (days  <  7) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function extractEmailFromBody(body: string): string | null {
  const m = body.match(/Email:\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i)
  return m ? m[1] : null
}

function extractNameFromBody(body: string): string | null {
  const m = body.match(/Name:\s*([^\n\r<]+)/i)
  return m ? m[1].trim() : null
}

function normalizeSubject(s: string) {
  return s.replace(/^(Re:|Fwd:|FW:|RE:|FWD:)\s*/gi, '').trim().toLowerCase()
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

/* ─── GET: fetch emails from INBOX ───────────────────── */
export async function GET(request: NextRequest) {
  const account = request.nextUrl.searchParams.get('account') as Account | null
  if (!account || !ACCOUNTS[account]) {
    return NextResponse.json({ error: 'Invalid account' }, { status: 400 })
  }

  const cfg  = ACCOUNTS[account]
  const pass = process.env[cfg.passKey]
  if (!pass) {
    return NextResponse.json({
      error: `Email not configured. Add ${cfg.passKey} to your Vercel environment variables.`,
    }, { status: 503 })
  }

  const client = new ImapFlow({
    host: cfg.imapHost, port: cfg.imapPort, secure: true,
    auth: { user: cfg.user, pass },
    tls: { rejectUnauthorized: false },
    logger: false,
  })

  const fetchFromMailbox = async (mailboxName: string): Promise<any[]> => {
    const results: any[] = []
    let lock: any = null
    try {
      lock = await client.getMailboxLock(mailboxName)
      const total: number = (client.mailbox as any)?.exists ?? 0
      if (total > 0) {
        const start = Math.max(1, total - 9)
        for await (const msg of client.fetch(`${start}:${total}`, { source: true, flags: true })) {
          try {
            if (!msg.source) continue
            const parsed = await simpleParser(msg.source)
            const body = parsed.text ?? stripHtml((parsed.html as string) ?? '')
            results.push({
              uid:       `${mailboxName}:${msg.uid}`,
              messageId: parsed.messageId ?? `uid-${mailboxName}-${msg.uid}`,
              inReplyTo: parsed.inReplyTo ?? null,
              replyTo:   parsed.replyTo?.value[0]?.address ?? null,
              from: {
                name:  parsed.from?.value[0]?.name  ?? parsed.from?.value[0]?.address?.split('@')[0] ?? 'Unknown',
                email: parsed.from?.value[0]?.address ?? '',
              },
              to:      parsed.to?.value.map((a: any) => a.address ?? '').filter(Boolean) ?? [],
              subject: parsed.subject ?? '(no subject)',
              date:    parsed.date ?? new Date(),
              body:    body.trim(),
              unread:  !msg.flags?.has('\\Seen'),
            })
          } catch { /* skip unparseable */ }
        }
      }
    } catch { /* mailbox may not exist */ } finally {
      try { lock?.release() } catch {}
    }
    return results
  }

  try {
    await client.connect()

    const inbox      = await fetchFromMailbox('INBOX')
    const spam       = await fetchFromMailbox('Spam')
    const junk       = await fetchFromMailbox('Junk')
    const sent       = await fetchFromMailbox('Sent')
    const sentItems  = await fetchFromMailbox('Sent Items')
    const emails = [...inbox, ...spam, ...junk, ...sent, ...sentItems]

    await client.logout()

    // Group by normalized subject → threads
    const groups = new Map<string, typeof emails>()
    for (const email of emails) {
      const key = normalizeSubject(email.subject)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(email)
    }

    const threads = []
    for (const msgs of groups.values()) {
      const sorted  = msgs.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      const latest  = sorted[sorted.length - 1]
      const first   = sorted[0]
      const isMine  = (e: string) => e.toLowerCase() === cfg.user.toLowerCase()

      const extractedEmail = extractEmailFromBody(first.body)
      const extractedName  = extractNameFromBody(first.body)
      const leadEmail = isMine(first.from.email)
        ? (first.to[0] ?? '')
        : (first.replyTo || extractedEmail || first.from.email)
      const leadName  = isMine(first.from.email)
        ? leadEmail.split('@')[0]
        : (extractedName || first.from.name || first.from.email.split('@')[0])

      threads.push({
        id:        first.uid,
        leadName:  leadName.charAt(0).toUpperCase() + leadName.slice(1),
        leadEmail,
        subject:   first.subject,
        unread:    sorted.some((m: any) => m.unread),
        starred:   false,
        lastTime:  relativeTime(new Date(latest.date)),
        lastDate:  new Date(latest.date).getTime(),
        preview:   latest.body.slice(0, 100),
        messageId: latest.messageId,
        messages:  sorted.map((m: any) => ({
          id:        m.uid,
          from:      isMine(m.from.email) ? cfg.user.split('@')[0] : (m.from.name || m.from.email.split('@')[0]),
          fromEmail: m.from.email,
          body:      m.body,
          time:      relativeTime(new Date(m.date)),
          type:      isMine(m.from.email) ? 'sent' : 'received',
        })),
      })
    }

    threads.sort((a: any, b: any) => (b.lastDate ?? 0) - (a.lastDate ?? 0))

    return NextResponse.json(threads)
  } catch (err: any) {
    try { await client.logout() } catch {}
    console.error('[emails] IMAP error:', err.message)
    return NextResponse.json({ error: `Could not connect to ${cfg.imapHost}: ${err.message}` }, { status: 500 })
  }
}

/* ─── POST: send / reply ──────────────────────────────── */
export async function POST(request: NextRequest) {
  const { account, to, subject, text, inReplyTo } = await request.json()

  if (!account || !to || !subject || !text) {
    return NextResponse.json({ error: 'account, to, subject and text are required.' }, { status: 400 })
  }

  const cfg  = ACCOUNTS[account as Account]
  if (!cfg) return NextResponse.json({ error: 'Invalid account' }, { status: 400 })

  const pass = process.env[cfg.passKey]
  if (!pass) return NextResponse.json({ error: `Email not configured for ${account}` }, { status: 503 })

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.smtpHost, port: cfg.smtpPort, secure: true,
      auth: { user: cfg.user, pass },
      tls: { rejectUnauthorized: false },
    })

    await transporter.sendMail({
      from:      `${cfg.user} <${cfg.user}>`,
      to,
      subject,
      text,
      ...(inReplyTo ? { inReplyTo, references: inReplyTo } : {}),
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[emails] SMTP error:', err.message)
    return NextResponse.json({ error: `Failed to send: ${err.message}` }, { status: 500 })
  }
}
