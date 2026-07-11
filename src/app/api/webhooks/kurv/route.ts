import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  try {
    let responseStr: string | null = null

    const contentType = request.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      const body = await request.json()
      responseStr = typeof body.response === 'string' ? body.response : JSON.stringify(body)
    } else {
      // form-encoded: response={"status":"ACK",...}
      const form = await request.formData()
      responseStr = form.get('response') as string | null
      if (!responseStr) {
        // fallback: try text body
        responseStr = await request.text()
      }
    }

    if (!responseStr) {
      return NextResponse.json({ error: 'No response data' }, { status: 400 })
    }

    const data = typeof responseStr === 'string' ? JSON.parse(responseStr) : responseStr

    // Only process successful payments
    if (data.status !== 'ACK' || Number(data.result_code) !== 100) {
      console.log('[webhooks/kurv] non-success payment:', data.status, data.result_code)
      return NextResponse.json({ received: true })
    }

    const referenceNumber = data.reference_number
    if (!referenceNumber) {
      return NextResponse.json({ error: 'No reference_number in payload' }, { status: 400 })
    }

    const supabase = adminClient()

    const { data: invoice, error: findError } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('invoice_number', referenceNumber)
      .single()

    if (findError || !invoice) {
      console.error('[webhooks/kurv] invoice not found:', referenceNumber)
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'Paid') {
      return NextResponse.json({ received: true }) // already paid, idempotent
    }

    const now = new Date()
    const paidAt =
      now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) +
      ' ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()

    await supabase
      .from('invoices')
      .update({ status: 'Paid', payment_void_date: paidAt })
      .eq('id', invoice.id)

    console.log('[webhooks/kurv] marked Paid:', referenceNumber)
    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[webhooks/kurv] error:', err.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
