import { createClient } from '@supabase/supabase-js'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import nodemailer from 'nodemailer'
import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getAccount(id: string) {
  const { data, error } = await adminClient()
    .from('connected_email_accounts')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as {
    id: number; label: string; email: string;
    imap_host: string; imap_port: number;
    smtp_host: string; smtp_port: number;
    password: string;
  }
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  <  1) return 'Just now'
  if (hours <  1) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  if (hours < 24) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  if (days === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function stripQuotedReply(body: string): string {
  const lines = body.split(/\r?\n/)
  const out: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (/^On .{5,}wrote:\s*$/i.test(trimmed)) break
    if (trimmed.startsWith('>')) continue
    out.push(line)
  }
  return out.join('\n').trim()
}

function normalizeSubject(s: string) {
  return s.replace(/^(Re:|Fwd:|FW:|RE:|FWD:)\s*/gi, '').trim().toLowerCase()
}

/* ── GET: fetch inbox ────────────────────────────────────── */
export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 })

  const acc = await getAccount(accountId)
  if (!acc) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true'
  const cacheKey = `team-mail:${accountId}`

  if (!forceRefresh) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } })
    } catch { /* fall through */ }
  }

  const client = new ImapFlow({
    host: acc.imap_host, port: acc.imap_port, secure: true,
    auth: { user: acc.email, pass: acc.password },
    tls: { rejectUnauthorized: false },
    logger: false,
  })

  const fetchMailbox = async (mailboxName: string): Promise<any[]> => {
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
              uid: `${mailboxName}:${msg.uid}`,
              messageId: parsed.messageId ?? `uid-${mailboxName}-${msg.uid}`,
              inReplyTo: parsed.inReplyTo ?? null,
              replyTo: parsed.replyTo?.value[0]?.address ?? null,
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
          } catch { /* skip */ }
        }
      }
    } catch (e: any) {
      if (!e?.message?.includes('does not exist') && !e?.message?.includes('NO')) {
        console.error(`[team-mail] fetchMailbox(${mailboxName}):`, e?.message)
      }
    } finally { try { lock?.release() } catch {} }
    return results
  }

  try {
    await client.connect()
    const isMine = (e: string) => e.toLowerCase() === acc.email.toLowerCase()

    const inbox     = await fetchMailbox('INBOX')
    const spam      = await fetchMailbox('Spam')
    const spamLow   = await fetchMailbox('spam')
    const junk      = await fetchMailbox('Junk')
    const junkLow   = await fetchMailbox('junk')
    const sent      = await fetchMailbox('Sent')
    const sentItems = await fetchMailbox('Sent Items')
    const allEmails = [...inbox, ...spam, ...spamLow, ...junk, ...junkLow, ...sent, ...sentItems]

    await client.logout()

    const groups = new Map<string, typeof allEmails>()
    for (const email of allEmails) {
      const key = normalizeSubject(email.subject)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(email)
    }

    const threads = []
    for (const msgs of groups.values()) {
      const sorted = msgs.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      const latest = sorted[sorted.length - 1]
      const first  = sorted[0]

      const leadEmail = isMine(first.from.email)
        ? (first.to[0] ?? '')
        : (first.replyTo || first.from.email)
      const leadName = isMine(first.from.email)
        ? leadEmail.split('@')[0]
        : (first.from.name || first.from.email.split('@')[0])

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
          from:      isMine(m.from.email) ? acc.label : (m.from.name || m.from.email.split('@')[0]),
          fromEmail: m.from.email,
          body:      m.body,
          time:      relativeTime(new Date(m.date)),
          type:      isMine(m.from.email) ? 'sent' : 'received',
        })),
      })
    }
    threads.sort((a: any, b: any) => (b.lastDate ?? 0) - (a.lastDate ?? 0))

    try { await redis.set(cacheKey, threads, { ex: 120 }) } catch { /* non-fatal */ }
    return NextResponse.json(threads, { headers: { 'X-Cache': 'MISS' } })
  } catch (err: any) {
    try { await client.logout() } catch {}
    return NextResponse.json({ error: `Could not connect to ${acc.imap_host}: ${err.message}` }, { status: 500 })
  }
}

/* ── POST: send / reply ──────────────────────────────────── */
export async function POST(request: NextRequest) {
  const { accountId, to, subject, text, inReplyTo } = await request.json()
  if (!accountId || !to || !subject || !text) {
    return NextResponse.json({ error: 'accountId, to, subject, text required' }, { status: 400 })
  }

  const acc = await getAccount(accountId)
  if (!acc) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const mailOptions = {
    from: `${acc.label} <${acc.email}>`,
    to, subject, text,
    ...(inReplyTo ? { inReplyTo, references: inReplyTo } : {}),
  }

  try {
    const transporter = nodemailer.createTransport({
      host: acc.smtp_host, port: acc.smtp_port, secure: acc.smtp_port === 465,
      auth: { user: acc.email, pass: acc.password },
      tls: { rejectUnauthorized: false },
    })
    await transporter.sendMail(mailOptions)
    try { await redis.del(`team-mail:${accountId}`) } catch { /* non-fatal */ }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to send: ${err.message}` }, { status: 500 })
  }
}

/* ── PATCH: mark as read ─────────────────────────────────── */
export async function PATCH(request: NextRequest) {
  const { accountId, uids } = await request.json()
  const acc = await getAccount(accountId)
  if (!acc) return NextResponse.json({ success: false })

  const client = new ImapFlow({
    host: acc.imap_host, port: acc.imap_port, secure: true,
    auth: { user: acc.email, pass: acc.password },
    tls: { rejectUnauthorized: false }, logger: false,
  })
  try {
    await client.connect()
    const byMailbox: Record<string, number[]> = {}
    for (const uid of (uids as string[])) {
      const idx = uid.indexOf(':')
      if (idx === -1) continue
      const mb = uid.slice(0, idx)
      const n  = parseInt(uid.slice(idx + 1))
      if (!byMailbox[mb]) byMailbox[mb] = []
      byMailbox[mb].push(n)
    }
    for (const [mb, list] of Object.entries(byMailbox)) {
      let lock: any = null
      try {
        lock = await client.getMailboxLock(mb)
        await client.messageFlagsAdd(list.join(','), ['\\Seen'], { uid: true } as any)
      } catch {} finally { try { lock?.release() } catch {} }
    }
    await client.logout()
  } catch { try { await client.logout() } catch {} }
  return NextResponse.json({ success: true })
}

/* ── DELETE: delete messages ─────────────────────────────── */
export async function DELETE(request: NextRequest) {
  const { accountId, uids } = await request.json()
  const acc = await getAccount(accountId)
  if (!acc) return NextResponse.json({ success: false })

  const client = new ImapFlow({
    host: acc.imap_host, port: acc.imap_port, secure: true,
    auth: { user: acc.email, pass: acc.password },
    tls: { rejectUnauthorized: false }, logger: false,
  })
  try {
    await client.connect()
    const byMailbox: Record<string, number[]> = {}
    for (const uid of (uids as string[])) {
      const idx = uid.indexOf(':')
      if (idx === -1) continue
      const mb = uid.slice(0, idx)
      const n  = parseInt(uid.slice(idx + 1))
      if (!byMailbox[mb]) byMailbox[mb] = []
      byMailbox[mb].push(n)
    }
    for (const [mb, list] of Object.entries(byMailbox)) {
      let lock: any = null
      try {
        lock = await client.getMailboxLock(mb)
        await client.messageDelete(list.join(','), { uid: true } as any)
      } catch {} finally { try { lock?.release() } catch {} }
    }
    await client.logout()
    try { await redis.del(`team-mail:${accountId}`) } catch { /* non-fatal */ }
  } catch { try { await client.logout() } catch {} }
  return NextResponse.json({ success: true })
}
