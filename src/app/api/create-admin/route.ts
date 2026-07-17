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

export async function POST(request: NextRequest) {
  const { secret } = await request.json()
  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = adminClient()

  // Check if already exists
  const { data: existing } = await supabase.auth.admin.listUsers()
  const alreadyExists = existing?.users?.some(u => u.email === 'test@admin.com')
  if (alreadyExists) {
    return NextResponse.json({ error: 'Admin already exists. You can log in directly.' }, { status: 409 })
  }

  // Create auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test@admin.com',
    password: 'testing123',
    email_confirm: true,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Insert profile into users table
  const { error: profileError } = await supabase
    .from('users')
    .insert({ id: data.user.id, name: 'Admin', role: 'Admin' })
  if (profileError) {
    // Rollback auth user
    await supabase.auth.admin.deleteUser(data.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
