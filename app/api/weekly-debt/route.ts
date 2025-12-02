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

    // Fetch all payments for members that have entries in this date range
    // We need to find the latest payment milestone (end_date) for each member
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('member_id, end_date')
      .order('end_date', { ascending: false })

    if (paymentsError) throw paymentsError

    // Create a map of latest payment milestone (end_date) per member
    // This represents the most recent date that has been paid for each member
    const latestPaymentMilestone = new Map<string, string>()
    
    const payments = Array.isArray(paymentsData) ? paymentsData : []
    
    // Find the latest end_date for each member
    payments.forEach((payment: any) => {
      const memberId = payment.member_id
      const endDate = payment.end_date
      
      if (!latestPaymentMilestone.has(memberId) || 
          endDate > latestPaymentMilestone.get(memberId)!) {
        latestPaymentMilestone.set(memberId, endDate)
      }
    })

    // Create a set of paid entry IDs
    // An entry is paid if its date <= latest payment milestone for that member
    const paidEntries = new Set<string>()
    
    if (entries.length > 0) {
      entries.forEach((entry: any) => {
        const memberId = entry.member_id
        const latestPaidDate = latestPaymentMilestone.get(memberId)
        
        // Entry is paid if there's a payment milestone and entry date <= milestone
        if (latestPaidDate && entry.date <= latestPaidDate) {
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

