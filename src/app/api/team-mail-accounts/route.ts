import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET — list accounts (passwords excluded)
export async function GET() {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('connected_email_accounts')
    .select('id, label, email, imap_host, imap_port, smtp_host, smtp_port, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ accounts: data })
}

// POST — add new account
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { label, email, imap_host, imap_port, smtp_host, smtp_port, password } = body

  if (!label?.trim() || !email?.trim() || !imap_host?.trim() || !smtp_host?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'label, email, imap_host, smtp_host, and password are required' }, { status: 400 })
  }

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('connected_email_accounts')
    .insert({
      label:     label.trim(),
      email:     email.trim(),
      imap_host: imap_host.trim(),
      imap_port: Number(imap_port) || 993,
      smtp_host: smtp_host.trim(),
      smtp_port: Number(smtp_port) || 465,
      password:  password.trim(),
    })
    .select('id, label, email, imap_host, imap_port, smtp_host, smtp_port, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ account: data }, { status: 201 })
}

// PATCH — update account (password optional)
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, label, email, imap_host, imap_port, smtp_host, smtp_port, password } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (label?.trim())     updates.label     = label.trim()
  if (email?.trim())     updates.email     = email.trim()
  if (imap_host?.trim()) updates.imap_host = imap_host.trim()
  if (imap_port)         updates.imap_port = Number(imap_port)
  if (smtp_host?.trim()) updates.smtp_host = smtp_host.trim()
  if (smtp_port)         updates.smtp_port = Number(smtp_port)
  if (password?.trim())  updates.password  = password.trim()

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('connected_email_accounts')
    .update(updates)
    .eq('id', id)
    .select('id, label, email, imap_host, imap_port, smtp_host, smtp_port, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ account: data })
}

// DELETE — remove account
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = adminClient()
  const { error } = await supabase.from('connected_email_accounts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
