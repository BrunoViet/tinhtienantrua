import * as XLSX from 'xlsx'
import { format, parseISO } from 'date-fns'
import vi from 'date-fns/locale/vi'
import { LunchEntryWithMember, DEFAULT_MEAL_PRICE } from './types'

export interface ExcelReportData {
  memberName: string
  startDate: string
  endDate: string
  entries: LunchEntryWithMember[]
}

export function exportMemberReportToExcel(data: ExcelReportData) {
  // Tạo workbook mới
  const workbook = XLSX.utils.book_new()

  // Chuẩn bị dữ liệu cho worksheet
  const worksheetData: any[] = []

  // Header row
  worksheetData.push(['Ngày tháng', 'Số tiền', 'Trạng thái', 'Ghi chú'])

  // Data rows
  let totalAmount = 0
  data.entries.forEach((entry: any) => {
    const date = format(parseISO(entry.date), 'dd/MM/yyyy', { locale: vi })
    const price = entry.price ?? DEFAULT_MEAL_PRICE
    const amount = price * entry.quantity
    totalAmount += amount
    
    // Check payment status
    const isPaid = entry.isPaid === true
    const status = isPaid ? 'Đã trả' : 'Chưa trả'

    worksheetData.push([
      date,
      amount,
      status,
      entry.note || '',
    ])
  })

  // Tổng cộng row
  worksheetData.push([]) // Empty row
  worksheetData.push(['TỔNG CỘNG', totalAmount, '', ''])

  // Tạo worksheet từ data
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Định dạng độ rộng cột
  worksheet['!cols'] = [
    { wch: 15 }, // Ngày tháng
    { wch: 15 }, // Số tiền
    { wch: 12 }, // Trạng thái
    { wch: 30 }, // Ghi chú
  ]

  // Thêm worksheet vào workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo cáo')

  // Tạo tên file
  const startDateFormatted = format(parseISO(data.startDate), 'dd-MM-yyyy', { locale: vi })
  const endDateFormatted = format(parseISO(data.endDate), 'dd-MM-yyyy', { locale: vi })
  const fileName = `${data.memberName}_${startDateFormatted}_${endDateFormatted}.xlsx`

  // Xuất file
  XLSX.writeFile(workbook, fileName)
}

