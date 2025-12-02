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

    // Find the latest payment milestone (end_date) for this member
    // An entry is paid if its date <= latest payment milestone
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('end_date')
      .eq('member_id', entry.member_id)
      .order('end_date', { ascending: false })

    if (paymentsError) throw paymentsError

    // Get the latest end_date (payment milestone)
    const latestPaidDate = payments && payments.length > 0 
      ? payments[0].end_date 
      : null

    // Entry is paid if there's a payment milestone and entry date <= milestone
    const isPaid = latestPaidDate && entry.date <= latestPaidDate

    return NextResponse.json({
      isPaid: isPaid || false,
    })
  } catch (error: any) {
    console.error('Error checking payment status:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

