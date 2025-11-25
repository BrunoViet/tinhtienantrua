import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { LunchEntry, LunchEntryWithMember } from '@/lib/types'

// GET lunch entry by id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('lunch_entries')
      .select(`
        *,
        member:members(*)
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: 'Lunch entry not found' },
        { status: 404 }
      )
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

    return NextResponse.json(entry)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PUT update lunch entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { memberId, date, quantity, price, note } = body

    const supabase = createServerClient()
    const updateData: any = {}
    if (memberId !== undefined) updateData.member_id = memberId
    if (date !== undefined) updateData.date = date
    if (quantity !== undefined) updateData.quantity = quantity
    if (price !== undefined) updateData.price = price ? parseInt(price) : null
    if (note !== undefined) updateData.note = note

    const { data, error } = await supabase
      .from('lunch_entries')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        member:members(*)
      `)
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Member already has an entry for this date' },
          { status: 409 }
        )
      }
      throw error
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Lunch entry not found' },
        { status: 404 }
      )
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

    return NextResponse.json(entry)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE lunch entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('lunch_entries')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

