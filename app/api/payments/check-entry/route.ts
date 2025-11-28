import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Check if a lunch entry is paid
// GET /api/payments/check-entry?entryId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entryId')

    if (!entryId) {
      return NextResponse.json(
        { error: 'entryId is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Get the entry first
    const { data: entry, error: entryError } = await supabase
      .from('lunch_entries')
      .select('member_id, date')
      .eq('id', entryId)
      .single()

    if (entryError) throw entryError
    if (!entry) {
      return NextResponse.json({ isPaid: false })
    }

    // Check if there's a payment that covers this entry's date
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id')
      .eq('member_id', entry.member_id)
      .lte('start_date', entry.date)
      .gte('end_date', entry.date)

    if (paymentsError) throw paymentsError

    return NextResponse.json({
      isPaid: payments && payments.length > 0,
    })
  } catch (error: any) {
    console.error('Error checking payment status:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

