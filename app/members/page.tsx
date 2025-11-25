'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Member, LunchEntryWithMember } from '@/lib/types'
import { Plus, Edit, Trash2, ArrowLeft, FileSpreadsheet } from 'lucide-react'
import { exportMemberReportToExcel } from '@/lib/excel-export'

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState({ name: '', isActive: true })
  const [exportDateRange, setExportDateRange] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  })
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members')
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      // Đảm bảo data là array
      if (Array.isArray(data)) {
        setMembers(data)
      } else {
        console.error('API returned non-array data:', data)
        setMembers([])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingMember) {
        // Update
        const res = await fetch(`/api/members/${editingMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Failed to update member')
      } else {
        // Create
        const res = await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Failed to create member')
      }
      fetchMembers()
      setShowModal(false)
      setEditingMember(null)
      setFormData({ name: '', isActive: true })
    } catch (error) {
      console.error('Error saving member:', error)
      alert('Có lỗi xảy ra khi lưu thành viên')
    }
  }

  const handleEdit = (member: Member) => {
    setEditingMember(member)
    setFormData({ name: member.name, isActive: member.isActive })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này?')) return

    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete member')
      fetchMembers()
    } catch (error) {
      console.error('Error deleting member:', error)
      alert('Có lỗi xảy ra khi xóa thành viên')
    }
  }

  const openAddModal = () => {
    setEditingMember(null)
    setFormData({ name: '', isActive: true })
    setShowModal(true)
  }

  const handleExportExcel = async () => {
    if (!selectedMember) return

    if (!exportDateRange.startDate || !exportDateRange.endDate) {
      alert('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc')
      return
    }

    if (exportDateRange.startDate > exportDateRange.endDate) {
      alert('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc')
      return
    }

    setExporting(true)
    try {
      const res = await fetch(
        `/api/member-report?memberId=${selectedMember.id}&startDate=${exportDateRange.startDate}&endDate=${exportDateRange.endDate}`
      )
      if (!res.ok) throw new Error('Failed to fetch report data')

      const entries: LunchEntryWithMember[] = await res.json()

      // Xuất Excel
      exportMemberReportToExcel({
        memberName: selectedMember.name,
        startDate: exportDateRange.startDate,
        endDate: exportDateRange.endDate,
        entries,
      })

      setShowExportModal(false)
      alert('Xuất file Excel thành công!')
    } catch (error) {
      console.error('Error exporting Excel:', error)
      alert('Có lỗi xảy ra khi xuất file Excel')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản Lý Thành Viên
            </h1>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm Thành Viên
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    Chưa có thành viên nào
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {member.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedMember(member)
                          setExportDateRange({
                            startDate: format(new Date(), 'yyyy-MM-dd'),
                            endDate: format(new Date(), 'yyyy-MM-dd'),
                          })
                          setShowExportModal(true)
                        }}
                        className="text-green-600 hover:text-green-900 mr-4"
                        title="Xuất Excel"
                      >
                        <FileSpreadsheet className="w-5 h-5 inline" />
                      </button>
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="w-5 h-5 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingMember ? 'Chỉnh Sửa Thành Viên' : 'Thêm Thành Viên Mới'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Hoạt động
                  </span>
                </label>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingMember(null)
                    setFormData({ name: '', isActive: true })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingMember ? 'Cập Nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Excel Modal */}
      {showExportModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Xuất Excel - {selectedMember.name}
              </h2>
              <button
                onClick={() => {
                  setShowExportModal(false)
                  setSelectedMember(null)
                }}
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
                  value={exportDateRange.startDate}
                  onChange={(e) =>
                    setExportDateRange({
                      ...exportDateRange,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={exportDateRange.endDate}
                  onChange={(e) =>
                    setExportDateRange({
                      ...exportDateRange,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="text-xs text-gray-500">
                <p>• File Excel sẽ chứa: Ngày tháng, Số tiền, Ghi chú</p>
                <p>• Tên file: {selectedMember.name}_dd-MM-yyyy_dd-MM-yyyy.xlsx</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowExportModal(false)
                  setSelectedMember(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={exporting}
              >
                Hủy
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? 'Đang xuất...' : 'Xuất Excel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

