import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { WeeklyDebt, DEFAULT_MEAL_PRICE } from '@/lib/types'

// GET weekly debt calculation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const mealPrice = searchParams.get('mealPrice')
      ? parseInt(searchParams.get('mealPrice')!)
      : DEFAULT_MEAL_PRICE

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('lunch_entries')
      .select(`
        member_id,
        quantity,
        price,
        member:members(id, name)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('member_id')

    if (error) throw error

    // Calculate total meals per member
    const debtMap = new Map<string, WeeklyDebt>()

    data.forEach((entry: any) => {
      const memberId = entry.member_id
      const memberName = entry.member.name
      const quantity = entry.quantity || 1
      // Sử dụng price từ entry, nếu null thì dùng giá mặc định
      const entryPrice = entry.price ?? mealPrice

      if (!debtMap.has(memberId)) {
        debtMap.set(memberId, {
          memberId,
          memberName,
          totalMeals: 0,
          totalAmount: 0,
        })
      }

      const debt = debtMap.get(memberId)!
      debt.totalMeals += quantity
      // Tính tổng tiền: số lượng * giá (có thể khác nhau cho mỗi entry)
      debt.totalAmount += quantity * entryPrice
    })

    const weeklyDebts: WeeklyDebt[] = Array.from(debtMap.values())
      .sort((a, b) => a.memberName.localeCompare(b.memberName))

    return NextResponse.json({
      startDate,
      endDate,
      mealPrice,
      debts: weeklyDebts,
      totalAmount: weeklyDebts.reduce((sum, d) => sum + d.totalAmount, 0),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

