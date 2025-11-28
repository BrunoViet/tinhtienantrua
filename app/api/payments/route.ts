import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { Payment } from '@/lib/types'

// GET all payments (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const supabase = createServerClient()
    let query = supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (memberId) {
      query = query.eq('member_id', memberId)
    }
    if (startDate) {
      query = query.gte('start_date', startDate)
    }
    if (endDate) {
      query = query.lte('end_date', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    if (!data || !Array.isArray(data)) {
      return NextResponse.json([])
    }

    const payments: Payment[] = data.map((payment: any) => ({
      id: payment.id,
      memberId: payment.member_id,
      startDate: payment.start_date,
      endDate: payment.end_date,
      amount: payment.amount,
      note: payment.note,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
    }))

    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST create new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId, startDate, endDate, amount, note } = body

    if (!memberId || !startDate || !endDate || amount === undefined) {
      return NextResponse.json(
        { error: 'memberId, startDate, endDate, and amount are required' },
        { status: 400 }
      )
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'startDate must be less than or equal to endDate' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('payments')
      .insert({
        member_id: memberId,
        start_date: startDate,
        end_date: endDate,
        amount: parseInt(amount),
        note: note || null,
      })
      .select()
      .single()

    if (error) throw error

    const payment: Payment = {
      id: data.id,
      memberId: data.member_id,
      startDate: data.start_date,
      endDate: data.end_date,
      amount: data.amount,
      note: data.note,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

