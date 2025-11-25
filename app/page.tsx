import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Quản Lí Tiền Ăn Trưa
        </h1>
        <div className="space-y-4">
          <Link
            href="/members"
            className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quản Lý Thành Viên
          </Link>
          <Link
            href="/calendar"
            className="block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Lịch Ăn Trưa
          </Link>
        </div>
      </div>
    </div>
  )
}

