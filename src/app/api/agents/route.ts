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
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set in .env.local' }, { status: 500 })
  }
  try {
    const supabase = adminClient()
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('role', 'Agent')
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { name, email, password, role } = await request.json()
  if (!name || !email || !password || !role)
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  if (!email.endsWith('@agent.com'))
    return NextResponse.json({ error: 'Agent email must end with @agent.com' }, { status: 400 })

  const supabase = adminClient()

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const { error: profileError } = await supabase
    .from('users')
    .insert({ id: authData.user.id, name, email, role })

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ id: authData.user.id, name, email, role, created_at: new Date().toISOString() })
}

export async function PATCH(request: NextRequest) {
  const { id, name, role, password } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

  const supabase = adminClient()

  const { error: profileError } = await supabase
    .from('users')
    .update({ name, role })
    .eq('id', id)

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  if (password) {
    const { error: pwError } = await supabase.auth.admin.updateUserById(id, { password })
    if (pwError) return NextResponse.json({ error: pwError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

  const supabase = adminClient()
  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
