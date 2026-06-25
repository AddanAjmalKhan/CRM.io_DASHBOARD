import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import nodemailer from 'nodemailer'
import { NextResponse, type NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})
const CACHE_TTL = 120 // seconds

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

type Account = 'IntelTrademark' | 'Office101' | 'Office102'

const ACCOUNTS: Record<Account, { imapHost: string; smtpHost: string; imapPort: number; smtpPort: number; user: string; passKey: string }> = {
  IntelTrademark: {
    imapHost: 'mail.inteltrademark.com', smtpHost: 'mail.inteltrademark.com',
    imapPort: 993, smtpPort: 465,
    user: 'info@inteltrademark.com',
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

function stripQuotedReply(body: string): string {
  const lines = body.split(/\r?\n/)
  const out: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    // Stop at Gmail/Outlook quote attribution line: "On [date] ... wrote:"
    if (/^On .{5,}wrote:\s*$/i.test(trimmed)) break
    // Skip > quoted lines
    if (trimmed.startsWith('>')) continue
    out.push(line)
  }
  return out.join('\n').trim()
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

  // Return cached result unless ?refresh=true
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true'
  const cacheKey = `emails:${account}`
  if (!forceRefresh) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } })
    } catch { /* cache unavailable, fall through to IMAP */ }
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
        const start = Math.max(1, total - 24)
        for await (const msg of client.fetch(`${start}:${total}`, { source: true, flags: true })) {
          try {
            if (!msg.source) continue
            const parsed = await simpleParser(msg.source)
            const raw  = parsed.text ?? stripHtml((parsed.html as string) ?? '')
            const body = stripQuotedReply(raw)
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
    } catch (e: any) {
      if (!e?.message?.includes('does not exist') && !e?.message?.includes('Mailbox doesn') && !e?.message?.includes('NO')) {
        console.error(`[emails] fetchFromMailbox(${mailboxName}) error:`, e?.message)
      }
    } finally {
      try { lock?.release() } catch {}
    }
    return results
  }

  try {
    await client.connect()

    const inbox      = await fetchFromMailbox('INBOX')
    const spam       = await fetchFromMailbox('Spam')
    const spamLower  = await fetchFromMailbox('spam')
    const junk       = await fetchFromMailbox('Junk')
    const junkLower  = await fetchFromMailbox('junk')
    const sent       = await fetchFromMailbox('Sent')
    const sentItems  = await fetchFromMailbox('Sent Items')
    const emails = [...inbox, ...spam, ...spamLower, ...junk, ...junkLower, ...sent, ...sentItems]

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
      // Self-notification: email sent from & to the firm's own address (e.g. SMTP contact form)
      const isSelfNotification = isMine(first.from.email) && first.to.every((t: string) => isMine(t))
      const leadEmail = isSelfNotification
        ? (first.replyTo || extractedEmail || first.to.find((t: string) => !isMine(t)) || first.to[0] || '')
        : isMine(first.from.email)
          ? (first.to[0] ?? '')
          : (first.replyTo || extractedEmail || first.from.email)
      const leadName = extractedName ||
        (isMine(first.from.email)
          ? leadEmail.split('@')[0]
          : (first.from.name || first.from.email.split('@')[0]))

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

    // Store in cache
    try { await redis.set(cacheKey, threads, { ex: CACHE_TTL }) } catch { /* non-fatal */ }

    return NextResponse.json(threads, { headers: { 'X-Cache': 'MISS' } })
  } catch (err: any) {
    try { await client.logout() } catch {}
    console.error('[emails] IMAP error:', err.message)
    return NextResponse.json({ error: `Could not connect to ${cfg.imapHost}: ${err.message}` }, { status: 500 })
  }
}

/* ─── PATCH: mark thread as read ─────────────────────── */
export async function PATCH(request: NextRequest) {
  const { account, uids } = await request.json()
  const cfg  = ACCOUNTS[account as Account]
  if (!cfg) return NextResponse.json({ error: 'Invalid account' }, { status: 400 })
  const pass = process.env[cfg.passKey]
  if (!pass) return NextResponse.json({ success: false })

  const client = new ImapFlow({
    host: cfg.imapHost, port: cfg.imapPort, secure: true,
    auth: { user: cfg.user, pass },
    tls: { rejectUnauthorized: false }, logger: false,
  })
  try {
    await client.connect()
    const byMailbox: Record<string, number[]> = {}
    for (const uid of (uids as string[])) {
      const idx = uid.indexOf(':')
      if (idx === -1) continue
      const mailbox = uid.slice(0, idx)
      const num = parseInt(uid.slice(idx + 1))
      if (!byMailbox[mailbox]) byMailbox[mailbox] = []
      byMailbox[mailbox].push(num)
    }
    for (const [mailbox, uidList] of Object.entries(byMailbox)) {
      let lock: any = null
      try {
        lock = await client.getMailboxLock(mailbox)
        await client.messageFlagsAdd(uidList.join(','), ['\\Seen'], { uid: true } as any)
      } catch {} finally { try { lock?.release() } catch {} }
    }
    await client.logout()
  } catch { try { await client.logout() } catch {} }
  return NextResponse.json({ success: true })
}

/* ─── DELETE: remove thread messages ─────────────────── */
export async function DELETE(request: NextRequest) {
  const { account, uids } = await request.json()
  const cfg  = ACCOUNTS[account as Account]
  if (!cfg) return NextResponse.json({ error: 'Invalid account' }, { status: 400 })
  const pass = process.env[cfg.passKey]
  if (!pass) return NextResponse.json({ success: false })

  const client = new ImapFlow({
    host: cfg.imapHost, port: cfg.imapPort, secure: true,
    auth: { user: cfg.user, pass },
    tls: { rejectUnauthorized: false }, logger: false,
  })
  try {
    await client.connect()
    const byMailbox: Record<string, number[]> = {}
    for (const uid of (uids as string[])) {
      const idx = uid.indexOf(':')
      if (idx === -1) continue
      const mailbox = uid.slice(0, idx)
      const num = parseInt(uid.slice(idx + 1))
      if (!byMailbox[mailbox]) byMailbox[mailbox] = []
      byMailbox[mailbox].push(num)
    }
    for (const [mailbox, uidList] of Object.entries(byMailbox)) {
      let lock: any = null
      try {
        lock = await client.getMailboxLock(mailbox)
        await client.messageDelete(uidList.join(','), { uid: true } as any)
      } catch {} finally { try { lock?.release() } catch {} }
    }
    await client.logout()
    try { await redis.del(`emails:${account}`) } catch { /* non-fatal */ }
  } catch { try { await client.logout() } catch {} }
  return NextResponse.json({ success: true })
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

  const mailOptions = {
    from:    `${cfg.user} <${cfg.user}>`,
    to, subject, text,
    ...(inReplyTo ? { inReplyTo, references: inReplyTo } : {}),
  }

  try {
    // Send via SMTP
    const transporter = nodemailer.createTransport({
      host: cfg.smtpHost, port: cfg.smtpPort, secure: true,
      auth: { user: cfg.user, pass },
      tls: { rejectUnauthorized: false },
    })
    await transporter.sendMail(mailOptions)

    // Save to Sent folder so it appears in the conversation thread
    try {
      const rawTransport = nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true })
      const rawInfo = await rawTransport.sendMail(mailOptions)
      const rawBuffer = rawInfo.message as Buffer

      const saveClient = new ImapFlow({
        host: cfg.imapHost, port: cfg.imapPort, secure: true,
        auth: { user: cfg.user, pass },
        tls: { rejectUnauthorized: false },
        logger: false,
      })
      await saveClient.connect()
      for (const folder of ['Sent', 'Sent Items', 'INBOX.Sent']) {
        try { await saveClient.append(folder, rawBuffer, ['\\Seen']); break } catch {}
      }
      await saveClient.logout()
    } catch { /* non-fatal — email was sent, just not saved to Sent folder */ }

    // Invalidate cache so next fetch sees the sent message
    try { await redis.del(`emails:${account}`) } catch { /* non-fatal */ }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[emails] SMTP error:', err.message)
    return NextResponse.json({ error: `Failed to send: ${err.message}` }, { status: 500 })
  }
}
