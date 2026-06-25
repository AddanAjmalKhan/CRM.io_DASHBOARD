import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatDate(d: string): string {
  if (!d) return ''
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

function mapRow(inv: any) {
  return {
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    custName: inv.cust_name,
    custEmail: inv.cust_email,
    custPhone: inv.cust_phone,
    source: inv.source,
    currency: inv.currency,
    amount: Number(inv.amount),
    date: inv.date,
    dueDate: inv.due_date,
    paymentType: inv.payment_type,
    status: inv.status as 'Pending' | 'Paid',
    paymentVoidDate: inv.payment_void_date ?? undefined,
    salesBy: inv.sales_by,
    services: (inv.invoice_services ?? []).map((s: any) => ({
      name: s.name,
      price: Number(s.price),
    })),
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_services(*)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data.map(mapRow))
}

export async function POST(req: NextRequest) {
  const { custName, custEmail, custPhone, source, currency, amount, date, dueDate, paymentType, salesBy, services } = await req.json()

  const { data: counterRow } = await supabase
    .from('invoice_counter')
    .select('counter')
    .eq('id', 1)
    .single()

  const newCounter = (counterRow?.counter ?? 16300) + 1
  await supabase.from('invoice_counter').update({ counter: newCounter }).eq('id', 1)

  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const invoiceNumber = `TO-AN-${yy}${mm}-${newCounter}`

  const { data: inv, error } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      cust_name: custName,
      cust_email: custEmail ?? '',
      cust_phone: custPhone ?? '',
      source,
      currency: currency ?? 'Dollar',
      amount,
      date,
      due_date: dueDate ? formatDate(dueDate) : '',
      payment_type: paymentType,
      status: 'Pending',
      sales_by: salesBy ?? '',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (services?.length) {
    await supabase.from('invoice_services').insert(
      services.map((s: { name: string; price: number }) => ({
        invoice_id: inv.id,
        name: s.name,
        price: s.price,
      }))
    )
  }

  const { data: full } = await supabase
    .from('invoices')
    .select('*, invoice_services(*)')
    .eq('id', inv.id)
    .single()

  return NextResponse.json({ success: true, invoice: mapRow(full) })
}

export async function PATCH(req: NextRequest) {
  const { id, status, custName, custEmail, custPhone, source, currency, amount, dueDate, paymentType, salesBy, services } = await req.json()

  const updates: Record<string, any> = {}
  if (status !== undefined) {
    updates.status = status
    if (status === 'Paid') {
      const now = new Date()
      updates.payment_void_date =
        now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) +
        ' ' +
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()
    }
  }
  if (custName !== undefined) updates.cust_name = custName
  if (custEmail !== undefined) updates.cust_email = custEmail
  if (custPhone !== undefined) updates.cust_phone = custPhone
  if (source !== undefined) updates.source = source
  if (currency !== undefined) updates.currency = currency
  if (amount !== undefined) updates.amount = amount
  if (dueDate) updates.due_date = formatDate(dueDate)
  if (paymentType !== undefined) updates.payment_type = paymentType
  if (salesBy !== undefined) updates.sales_by = salesBy

  const { error } = await supabase.from('invoices').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (services !== undefined) {
    await supabase.from('invoice_services').delete().eq('invoice_id', id)
    if (services.length > 0) {
      await supabase.from('invoice_services').insert(
        services.map((s: { name: string; price: number }) => ({
          invoice_id: id,
          name: s.name,
          price: s.price,
        }))
      )
    }
  }

  const { data: full } = await supabase
    .from('invoices')
    .select('*, invoice_services(*)')
    .eq('id', id)
    .single()

  return NextResponse.json({ success: true, invoice: mapRow(full) })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
