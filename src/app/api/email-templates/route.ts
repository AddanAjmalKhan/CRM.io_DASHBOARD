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

export async function GET() {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, subject, body: emailBody } = body

  if (!name?.trim() || !subject?.trim() || !emailBody?.trim()) {
    return NextResponse.json({ error: 'name, subject, and body are required' }, { status: 400 })
  }

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('email_templates')
    .insert({ name: name.trim(), subject: subject.trim(), body: emailBody.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, name, subject, body: emailBody } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const updates: Record<string, string> = {}
  if (name?.trim()) updates.name = name.trim()
  if (subject?.trim()) updates.subject = subject.trim()
  if (emailBody?.trim()) updates.body = emailBody.trim()

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('email_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = adminClient()
  const { error } = await supabase.from('email_templates').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
