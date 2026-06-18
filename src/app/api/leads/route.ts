import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

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
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, email, phone, source, role, country, ip_address, ip_city, ip_state, ip_country } = body

  if (!name || !email) return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('leads')
    .insert({ name, email, phone, source, role, country, ip_address, ip_city, ip_state, ip_country })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, ...fields } = body

  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('leads')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

  const supabase = adminClient()
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
