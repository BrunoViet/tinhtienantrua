import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { LunchEntryWithMember } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET lunch entries for a specific member in date range
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const memberId = searchParams.get('memberId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!memberId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'memberId, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('lunch_entries')
      .select(`
        *,
        member:members(*)
      `)
      .eq('member_id', memberId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error

    // Đảm bảo data là array
    if (!data || !Array.isArray(data)) {
      return NextResponse.json([])
    }

    const entries: LunchEntryWithMember[] = data.map((entry: any) => ({
      id: entry.id,
      memberId: entry.member_id,
      date: entry.date,
      quantity: entry.quantity,
      price: entry.price ?? null,
      note: entry.note,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      member: {
        id: entry.member.id,
        name: entry.member.name,
        isActive: entry.member.is_active,
      },
    }))

    return NextResponse.json(entries)
  } catch (error: any) {
    console.error('Error fetching member report:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

