import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  // Validate secret
  const secret = request.headers.get('x-api-secret')
  if (secret !== process.env.CONTACT_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, email, phone, source, country, ip_address, ip_city, ip_state, ip_country } = body

  if (!name || !email || !source) {
    return NextResponse.json({ error: 'name, email and source are required.' }, { status: 400 })
  }

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('leads')
    .insert({
      name,
      email,
      phone:      phone      ?? null,
      source,
      role:       'Client',
      country:    country    ?? null,
      ip_address: ip_address ?? null,
      ip_city:    ip_city    ?? null,
      ip_state:   ip_state   ?? null,
      ip_country: ip_country ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, lead: data })
}

// Allow browsers to preflight (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-secret',
    },
  })
}
