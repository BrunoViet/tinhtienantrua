import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { LunchEntry, LunchEntryWithMember } from '@/lib/types'

// GET all lunch entries (with optional date filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const supabase = createServerClient()
    let query = supabase
      .from('lunch_entries')
      .select(`
        *,
        member:members(*)
      `)
      .order('date', { ascending: true })

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data, error } = await query

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
    console.error('Error fetching lunch entries:', error)
    // Trả về array rỗng thay vì object error để tránh lỗi .map()
    return NextResponse.json([], { status: 500 })
  }
}

// POST create new lunch entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId, date, quantity, price, note } = body

    if (!memberId || !date) {
      return NextResponse.json(
        { error: 'memberId and date are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('lunch_entries')
      .insert({
        member_id: memberId,
        date,
        quantity: quantity || 1,
        price: price ? parseInt(price) : null,
        note: note || null,
      })
      .select(`
        *,
        member:members(*)
      `)
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Member already has an entry for this date' },
          { status: 409 }
        )
      }
      throw error
    }

    const entry: LunchEntryWithMember = {
      id: data.id,
      memberId: data.member_id,
      date: data.date,
      quantity: data.quantity,
      price: data.price ?? null,
      note: data.note,
      created_at: data.created_at,
      updated_at: data.updated_at,
      member: {
        id: data.member.id,
        name: data.member.name,
        isActive: data.member.is_active,
      },
    }

    return NextResponse.json(entry, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

