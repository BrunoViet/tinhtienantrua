'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, startOfWeek, addDays, addWeeks, subWeeks, parseISO } from 'date-fns'
import vi from 'date-fns/locale/vi'
import { ArrowLeft, ArrowRight, Plus, Edit, Trash2, Calculator, CheckCircle2 } from 'lucide-react'
import { LunchEntryWithMember, Member, WeeklyDebt, Payment, DEFAULT_MEAL_PRICE } from '@/lib/types'
import { useNotifications } from '@/hooks/useNotifications'

export default function CalendarPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [entries, setEntries] = useState<LunchEntryWithMember[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showDebtModal, setShowDebtModal] = useState(false)
  const [showDateRangeModal, setShowDateRangeModal] = useState(false)
  const [weeklyDebt, setWeeklyDebt] = useState<any>(null)
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  })
  const [editingEntry, setEditingEntry] = useState<LunchEntryWithMember | null>(null)
  const [formData, setFormData] = useState({
    memberId: '',
    quantity: 1,
    price: '',
    note: '',
  })
  const [payments, setPayments] = useState<Payment[]>([])
  const [paidEntryIds, setPaidEntryIds] = useState<Set<string>>(new Set())
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<string>('')
  const [paymentEndDate, setPaymentEndDate] = useState<string>('')
  const { addNotification, NotificationContainer } = useNotifications()

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    fetchData()
    fetchPayments()
  }, [currentWeek])

  useEffect(() => {
    checkPaidEntries()
  }, [entries, payments])

  const sortEntries = (list: LunchEntryWithMember[]) =>
    [...list].sort((a, b) => {
      if (a.date === b.date) {
        return a.member.name.localeCompare(b.member.name, 'vi', {
          sensitivity: 'base',
        })
      }
      return a.date.localeCompare(b.date)
    })

  const fetchData = async () => {
    setLoading(true)
    try {
      const startDate = format(weekStart, 'yyyy-MM-dd')
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd')

      const [entriesRes, membersRes] = await Promise.all([
        fetch(`/api/lunch-entries?startDate=${startDate}&endDate=${endDate}`),
        fetch('/api/members'),
      ])

      if (!entriesRes.ok) {
        throw new Error(`Failed to fetch entries: ${entriesRes.status}`)
      }
      if (!membersRes.ok) {
        throw new Error(`Failed to fetch members: ${membersRes.status}`)
      }

      const entriesData = await entriesRes.json()
      const membersData = await membersRes.json()

      // Đảm bảo data là array
      if (Array.isArray(entriesData)) {
        setEntries(sortEntries(entriesData))
      } else {
        console.error('Entries API returned non-array data:', entriesData)
        setEntries([])
      }

      if (Array.isArray(membersData)) {
        setMembers(membersData.filter((m: Member) => m.isActive))
      } else {
        console.error('Members API returned non-array data:', membersData)
        setMembers([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setEntries([])
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      // Fetch all payments that might cover entries in the current week
      const startDate = format(weekStart, 'yyyy-MM-dd')
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd')

      // Fetch payments that overlap with the current week
      // We need to check payments where start_date <= endDate AND end_date >= startDate
      const res = await fetch(`/api/payments`)
      if (!res.ok) throw new Error('Failed to fetch payments')
      const data = await res.json()
      const allPayments = Array.isArray(data) ? data : []
      
      // Filter payments that overlap with current week
      const relevantPayments = allPayments.filter((payment: Payment) => {
        return payment.startDate <= endDate && payment.endDate >= startDate
      })
      
      setPayments(relevantPayments)
    } catch (error) {
      console.error('Error fetching payments:', error)
      setPayments([])
    }
  }

  const checkPaidEntries = async () => {
    if (entries.length === 0) {
      setPaidEntryIds(new Set())
      return
    }

    // Create a map of latest payment milestone (end_date) per member
    // This represents the most recent date that has been paid for each member
    const latestPaymentMilestone = new Map<string, string>()
    
    // Find the latest end_date for each member
    payments.forEach((payment) => {
      const memberId = payment.memberId
      const endDate = payment.endDate
      
      if (!latestPaymentMilestone.has(memberId) || 
          endDate > latestPaymentMilestone.get(memberId)!) {
        latestPaymentMilestone.set(memberId, endDate)
      }
    })

    const paidIds = new Set<string>()
    
    for (const entry of entries) {
      const memberId = entry.memberId
      const latestPaidDate = latestPaymentMilestone.get(memberId)
      
      // Entry is paid if there's a payment milestone and entry date <= milestone
      if (latestPaidDate && entry.date <= latestPaidDate) {
        paidIds.add(entry.id)
      }
    }

    setPaidEntryIds(paidIds)
  }

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    setSelectedDate(dateStr)
    setEditingEntry(null)
    setFormData({ memberId: '', quantity: 1, price: '', note: '' })
    setShowSidebar(true)
  }

  const handleEditEntry = (entry: LunchEntryWithMember) => {
    setEditingEntry(entry)
    setSelectedDate(entry.date)
    setFormData({
      memberId: entry.memberId,
      quantity: entry.quantity,
      price: entry.price ? entry.price.toString() : '',
      note: entry.note || '',
    })
    setShowSidebar(true)
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục này?')) return

    try {
      const res = await fetch(`/api/lunch-entries/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete entry')
      setEntries((prev) => prev.filter((entry) => entry.id !== id))
      if (showSidebar) setShowSidebar(false)
      addNotification('Đã xóa mục ăn trưa', 'success')
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Có lỗi xảy ra khi xóa mục')
    }
  }

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate) return

    try {
      if (editingEntry) {
        const res = await fetch(`/api/lunch-entries/${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            date: selectedDate,
          }),
        })
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to update entry')
        }
        const updated: LunchEntryWithMember = await res.json()
        setEntries((prev) =>
          sortEntries(
            prev.map((entry) => (entry.id === updated.id ? updated : entry))
          )
        )
        addNotification('Cập nhật mục ăn trưa thành công')
      } else {
        const res = await fetch('/api/lunch-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            date: selectedDate,
          }),
        })
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to create entry')
        }
        const created: LunchEntryWithMember = await res.json()
        setEntries((prev) => sortEntries([...prev, created]))
        addNotification('Thêm mục ăn trưa thành công')
      }
      setShowSidebar(false)
      setEditingEntry(null)
      setFormData({ memberId: '', quantity: 1, price: '', note: '' })
    } catch (error: any) {
      console.error('Error saving entry:', error)
      alert(error.message || 'Có lỗi xảy ra khi lưu mục')
    }
  }

  const handleCalculateDebt = async () => {
    try {
      const startDate = format(weekStart, 'yyyy-MM-dd')
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd')

      const res = await fetch(
        `/api/weekly-debt?startDate=${startDate}&endDate=${endDate}&mealPrice=${DEFAULT_MEAL_PRICE}`
      )
      if (!res.ok) throw new Error('Failed to calculate debt')

      const data = await res.json()
      setWeeklyDebt(data)
      setShowDebtModal(true)
    } catch (error) {
      console.error('Error calculating debt:', error)
      alert('Có lỗi xảy ra khi tính toán nợ')
    }
  }

  const handleCalculateDebtByDateRange = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc')
      return
    }

    if (dateRange.startDate > dateRange.endDate) {
      alert('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc')
      return
    }

    try {
      const res = await fetch(
        `/api/weekly-debt?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&mealPrice=${DEFAULT_MEAL_PRICE}`
      )
      if (!res.ok) throw new Error('Failed to calculate debt')

      const data = await res.json()
      setWeeklyDebt(data)
      setShowDateRangeModal(false)
      setShowDebtModal(true)
    } catch (error) {
      console.error('Error calculating debt:', error)
      alert('Có lỗi xảy ra khi tính toán nợ')
    }
  }

  const handleMarkAsPaid = async () => {
    if (!selectedMemberForPayment || !weeklyDebt) {
      alert('Vui lòng chọn thành viên')
      return
    }

    if (!paymentEndDate) {
      alert('Vui lòng chọn ngày thanh toán')
      return
    }

    if (paymentEndDate < weeklyDebt.startDate) {
      alert('Ngày thanh toán không thể nhỏ hơn ngày bắt đầu')
      return
    }

    const selectedDebt = weeklyDebt.debts.find(
      (d: WeeklyDebt) => d.memberId === selectedMemberForPayment
    )

    if (!selectedDebt) {
      alert('Không tìm thấy thông tin nợ của thành viên này')
      return
    }

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberForPayment,
          startDate: weeklyDebt.startDate,
          endDate: paymentEndDate,
          amount: selectedDebt.totalAmount,
          note: `Thanh toán dư nợ từ ${weeklyDebt.startDate} đến ${paymentEndDate}`,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create payment')
      }

      const payment = await res.json()
      setPayments((prev) => [...prev, payment])
      addNotification('Đã đánh dấu thanh toán thành công', 'success')
      setShowPaymentModal(false)
      setSelectedMemberForPayment('')
      setPaymentEndDate('')
      
      // Refresh data to update paid status
      await fetchPayments()
      await fetchData()
    } catch (error: any) {
      console.error('Error marking as paid:', error)
      alert(error.message || 'Có lỗi xảy ra khi đánh dấu thanh toán')
    }
  }

  const getEntriesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return entries.filter((entry) => entry.date === dateStr)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek((prev) =>
      direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1)
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Đang tải...</div>
      </div>
    )
  }

  return (
    <>
      <NotificationContainer />
      <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Lịch Ăn Trưa</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCalculateDebt}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Calculator className="w-5 h-5" />
              Tính Nợ Tuần
            </button>
            <button
              onClick={() => {
                setDateRange({
                  startDate: format(new Date(), 'yyyy-MM-dd'),
                  endDate: format(new Date(), 'yyyy-MM-dd'),
                })
                setShowDateRangeModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Calculator className="w-5 h-5" />
              Tính Nợ Khoảng Ngày
            </button>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold">
              {format(weekStart, 'dd MMMM yyyy', { locale: vi })} -{' '}
              {format(addDays(weekStart, 6), 'dd MMMM yyyy', { locale: vi })}
            </h2>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const dayEntries = getEntriesForDate(day)
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

            return (
              <div
                key={index}
                className={`bg-white rounded-lg shadow p-4 min-h-[200px] ${
                  isToday ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="mb-3">
                  <div className="text-sm text-gray-500">
                    {format(day, 'EEEE', { locale: vi })}
                  </div>
                  <div className="text-lg font-semibold">
                    {format(day, 'dd/MM')}
                  </div>
                </div>
                <button
                  onClick={() => handleDateClick(day)}
                  className="w-full mb-2 p-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Thêm
                </button>
                <div className="space-y-2">
                  {dayEntries.map((entry) => {
                    const isPaid = paidEntryIds.has(entry.id)
                    return (
                      <div
                        key={entry.id}
                        className="p-2 bg-gray-50 rounded text-sm hover:bg-gray-100 transition-colors cursor-pointer group relative"
                        onClick={() => handleEditEntry(entry)}
                      >
                        <div className="font-medium text-gray-900">
                          {entry.member.name}
                        </div>
                        {entry.price && (
                          <div className="text-xs text-gray-600 mt-1">
                            {entry.quantity > 1 && `Số lượng: ${entry.quantity} × `}
                            {`${entry.price.toLocaleString('vi-VN')} VND`}
                            {entry.quantity > 1 && (
                              <span className="font-semibold">
                                {' '}= {(entry.quantity * entry.price).toLocaleString('vi-VN')} VND
                              </span>
                            )}
                          </div>
                        )}
                        {entry.note && (
                          <div className="text-xs text-gray-500 mt-1">
                            {entry.note}
                          </div>
                        )}
                        <div className="mt-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditEntry(entry)
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteEntry(entry.id)
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {isPaid && (
                          <div className="absolute bottom-1 right-1">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex z-50">
          <div className="ml-auto w-full max-w-md bg-white shadow-xl h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingEntry ? 'Chỉnh Sửa' : 'Thêm Mới'} -{' '}
                  {selectedDate &&
                    format(parseISO(selectedDate), 'dd/MM/yyyy', { locale: vi })}
                </h2>
                <button
                  onClick={() => {
                    setShowSidebar(false)
                    setEditingEntry(null)
                    setFormData({ memberId: '', quantity: 1, price: '', note: '' })
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitEntry}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thành viên
                  </label>
                  <select
                    required
                    value={formData.memberId}
                    onChange={(e) =>
                      setFormData({ ...formData, memberId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn thành viên</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá tiền mỗi suất (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: e.target.value,
                      })
                    }
                    placeholder="Nhập giá tiền"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSidebar(false)
                      setEditingEntry(null)
                      setFormData({ memberId: '', quantity: 1, price: '', note: '' })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingEntry ? 'Cập Nhật' : 'Thêm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Selection Modal */}
      {showDateRangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Chọn Khoảng Ngày</h2>
              <button
                onClick={() => setShowDateRangeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="text-xs text-gray-500">
                <p>• Chọn khoảng ngày để tính tổng tiền nợ của các thành viên</p>
                <p>• Nếu mục ăn trưa có giá riêng, sẽ dùng giá đó</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDateRangeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCalculateDebtByDateRange}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Tính Nợ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debt Modal */}
      {showDebtModal && weeklyDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Tính Nợ</h2>
              <button
                onClick={() => setShowDebtModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 text-sm text-gray-600">
              <p>
                Từ {format(parseISO(weeklyDebt.startDate), 'dd/MM/yyyy')} đến{' '}
                {format(parseISO(weeklyDebt.endDate), 'dd/MM/yyyy')}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Thành viên
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Số suất
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Tổng tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {weeklyDebt.debts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    weeklyDebt.debts.map((debt: WeeklyDebt) => (
                      <tr key={debt.memberId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {debt.memberName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {debt.totalMeals}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                          {debt.totalAmount.toLocaleString('vi-VN')} VND
                        </td>
                      </tr>
                    ))
                  )}
                  {weeklyDebt.debts.length > 0 && (
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        TỔNG CỘNG
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {weeklyDebt.debts.reduce(
                          (sum: number, d: WeeklyDebt) => sum + d.totalMeals,
                          0
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {weeklyDebt.totalAmount.toLocaleString('vi-VN')} VND
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => {
                  setShowPaymentModal(true)
                  setSelectedMemberForPayment('')
                  if (weeklyDebt) {
                    setPaymentEndDate(weeklyDebt.endDate)
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Đánh Dấu Đã Thanh Toán
              </button>
              <button
                onClick={() => setShowDebtModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && weeklyDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Đánh Dấu Đã Thanh Toán</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedMemberForPayment('')
                  setPaymentEndDate('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn thành viên
                </label>
                <select
                  value={selectedMemberForPayment}
                  onChange={(e) => setSelectedMemberForPayment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Chọn thành viên</option>
                  {weeklyDebt.debts.map((debt: WeeklyDebt) => (
                    <option key={debt.memberId} value={debt.memberId}>
                      {debt.memberName} - {debt.totalAmount.toLocaleString('vi-VN')} VND
                    </option>
                  ))}
                </select>
              </div>

              {selectedMemberForPayment && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày thanh toán gần nhất
                    </label>
                    <input
                      type="date"
                      value={paymentEndDate}
                      onChange={(e) => setPaymentEndDate(e.target.value)}
                      min={weeklyDebt.startDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ngày này sẽ được cập nhật vào DB như ngày thanh toán gần nhất của member
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <p>
                        <span className="font-semibold">Khoảng ngày:</span>{' '}
                        {format(parseISO(weeklyDebt.startDate), 'dd/MM/yyyy')} -{' '}
                        {format(parseISO(weeklyDebt.endDate), 'dd/MM/yyyy')}
                      </p>
                      {(() => {
                        const selectedDebt = weeklyDebt.debts.find(
                          (d: WeeklyDebt) => d.memberId === selectedMemberForPayment
                        )
                        return selectedDebt ? (
                          <>
                            <p className="mt-2">
                              <span className="font-semibold">Số suất:</span> {selectedDebt.totalMeals}
                            </p>
                            <p className="mt-1">
                              <span className="font-semibold">Tổng tiền:</span>{' '}
                              <span className="text-green-600 font-bold">
                                {selectedDebt.totalAmount.toLocaleString('vi-VN')} VND
                              </span>
                            </p>
                          </>
                        ) : null
                      })()}
                    </div>
                  </div>
                </>
              )}

              <div className="text-xs text-gray-500">
                <p>• Sau khi xác nhận, các mục ăn trưa trong khoảng ngày này sẽ được đánh dấu đã thanh toán</p>
                <p>• Các card sẽ hiển thị tick xanh ở góc dưới bên phải</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedMemberForPayment('')
                  setPaymentEndDate('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={!selectedMemberForPayment || !paymentEndDate}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Xác Nhận
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

