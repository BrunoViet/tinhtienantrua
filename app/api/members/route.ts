import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { Member } from '@/lib/types'

// GET all members
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    // Đảm bảo data là array
    if (!data || !Array.isArray(data)) {
      return NextResponse.json([])
    }

    // Transform snake_case to camelCase
    const members: Member[] = data.map((m: any) => ({
      id: m.id,
      name: m.name,
      isActive: m.is_active,
      created_at: m.created_at,
      updated_at: m.updated_at,
    }))

    return NextResponse.json(members)
  } catch (error: any) {
    console.error('Error fetching members:', error)
    // Trả về array rỗng thay vì object error để tránh lỗi .map()
    return NextResponse.json([], { status: 500 })
  }
}

// POST create new member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, isActive } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('members')
      .insert({
        name,
        is_active: isActive !== undefined ? isActive : true,
      })
      .select()
      .single()

    if (error) throw error

    const member: Member = {
      id: data.id,
      name: data.name,
      isActive: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }

    return NextResponse.json(member, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

