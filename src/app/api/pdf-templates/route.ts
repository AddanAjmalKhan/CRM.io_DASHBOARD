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
    .from('pdf_templates')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, title, subtitle, footer_text } = body

  if (!name?.trim() || !title?.trim()) {
    return NextResponse.json({ error: 'name and title are required' }, { status: 400 })
  }

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('pdf_templates')
    .insert({
      name: name.trim(),
      title: title.trim(),
      subtitle: subtitle?.trim() ?? '',
      footer_text: footer_text?.trim() ?? '',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, name, title, subtitle, footer_text } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const updates: Record<string, string> = {}
  if (name?.trim()) updates.name = name.trim()
  if (title?.trim()) updates.title = title.trim()
  if (subtitle !== undefined) updates.subtitle = subtitle?.trim() ?? ''
  if (footer_text !== undefined) updates.footer_text = footer_text?.trim() ?? ''

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('pdf_templates')
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
  const { error } = await supabase.from('pdf_templates').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
