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
    
    // Fetch lunch entries
    const { data: entriesData, error: entriesError } = await supabase
      .from('lunch_entries')
      .select(`
        id,
        member_id,
        date,
        quantity,
        price,
        member:members(id, name)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('member_id')

    if (entriesError) throw entriesError

    // Ensure entriesData is an array
    const entries = Array.isArray(entriesData) ? entriesData : []

    // Fetch payments that might cover entries in this date range
    // Payments that overlap with the date range
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('member_id, start_date, end_date')
      .lte('start_date', endDate)
      .gte('end_date', startDate)

    if (paymentsError) throw paymentsError

    // Create a set of paid entry dates per member
    // An entry is paid if there's a payment covering its date for that member
    const paidEntries = new Set<string>()
    
    const payments = Array.isArray(paymentsData) ? paymentsData : []
    
    if (payments.length > 0 && entries.length > 0) {
      entries.forEach((entry: any) => {
        const isPaid = payments.some(
          (payment: any) =>
            payment.member_id === entry.member_id &&
            payment.start_date <= entry.date &&
            payment.end_date >= entry.date
        )
        if (isPaid) {
          paidEntries.add(entry.id)
        }
      })
    }

    // Calculate total meals per member, excluding paid entries
    const debtMap = new Map<string, WeeklyDebt>()

    entries.forEach((entry: any) => {
      // Skip if this entry is already paid
      if (paidEntries.has(entry.id)) {
        return
      }

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

